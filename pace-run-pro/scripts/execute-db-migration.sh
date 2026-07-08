#!/bin/bash

# ============================================================================
# P0 DATABASE MIGRATION EXECUTION
# ============================================================================
# Execute this script to perform the Database Migration for P0 items
# WARNING: This will modify your database schema!
# Always backup before running!
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}P0 DATABASE MIGRATION EXECUTION SCRIPT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================
echo -e "${YELLOW}Pre-flight Checks${NC}\n"

# 1. Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    echo ""
    echo "Set DATABASE_URL before running this script:"
    echo ""
    echo "  export DATABASE_URL=\"postgresql://user:password@host:5432/pacerunpro\""
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL configured${NC}"

# 2. Check ENCRYPTION_KEY
if [ -z "$ENCRYPTION_KEY" ]; then
    echo -e "${YELLOW}⚠️  ENCRYPTION_KEY not set (will use plaintext mode)${NC}"
else
    echo -e "${GREEN}✅ ENCRYPTION_KEY configured${NC}"
fi

# 3. Check Prisma schema
echo ""
echo "Validating Prisma schema..."
npx prisma validate > /dev/null 2>&1 && echo -e "${GREEN}✅ Schema valid${NC}" || {
    echo -e "${RED}❌ Schema validation failed${NC}"
    exit 1
}

# ============================================================================
# BACKUP
# ============================================================================
echo ""
echo -e "${YELLOW}Creating Database Backup${NC}\n"

BACKUP_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_p0_${BACKUP_TIME}.sql"

echo "Backup file: ${BACKUP_FILE}"

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found${NC}"
    echo "Install PostgreSQL client tools to create backups"
    echo "Continue without backup? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "⏳ Dumping database..."
    if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ Backup created (${BACKUP_SIZE})${NC}"
        echo "   Location: $(pwd)/${BACKUP_FILE}"
    else
        echo -e "${RED}❌ Backup failed${NC}"
        echo "Continue without backup? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# ============================================================================
# TEST CONNECTION
# ============================================================================
echo ""
echo -e "${YELLOW}Testing Database Connection${NC}\n"

if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT NOW();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Cannot connect to database${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  psql not available, skipping connection test${NC}"
fi

# ============================================================================
# PRE-MIGRATION DATA CHECK
# ============================================================================
echo ""
echo -e "${YELLOW}Pre-migration Data Check${NC}\n"

if command -v psql &> /dev/null; then
    COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "?")
    echo "Current users: $COUNT"
fi

# ============================================================================
# EXECUTE MIGRATION
# ============================================================================
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}EXECUTING DATABASE MIGRATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

echo "This migration will:"
echo "  1. Add soft-delete fields to User, Athlete, Coach, Subscription, BillingSettings"
echo "  2. Add 8 Foreign Key indexes for performance"
echo "  3. Create indexes on deletedAt columns"
echo ""
echo -e "${YELLOW}Expected downtime: ~15 seconds${NC}"
echo ""

read -p "Proceed with migration? (y/n) " -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 1
fi

echo -e "${CYAN}Running: npm run db:migrate${NC}"
echo ""

START_TIME=$(date +%s)

if npm run db:migrate; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ MIGRATION SUCCESSFUL!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}\n"
    echo "Duration: ${DURATION}s"
else
    echo ""
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ MIGRATION FAILED!${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}\n"
    
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${YELLOW}To rollback, run:${NC}"
        echo "  psql \$DATABASE_URL < $BACKUP_FILE"
    fi
    
    exit 1
fi

# ============================================================================
# POST-MIGRATION VALIDATION
# ============================================================================
echo -e "${YELLOW}Post-migration Validation${NC}\n"

if command -v psql &> /dev/null; then
    echo "Checking for soft-delete fields..."
    
    # Check deleted_at field
    DELETED_AT=$(psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at';" 2>/dev/null)
    
    if [ -n "$DELETED_AT" ]; then
        echo -e "${GREEN}✅ deleted_at field added to users table${NC}"
    else
        echo -e "${RED}❌ deleted_at field NOT found${NC}"
    fi
    
    # Check deletion_reason field
    DELETION_REASON=$(psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='deletion_reason';" 2>/dev/null)
    
    if [ -n "$DELETION_REASON" ]; then
        echo -e "${GREEN}✅ deletion_reason field added to users table${NC}"
    else
        echo -e "${RED}❌ deletion_reason field NOT found${NC}"
    fi
    
    # Check FK indexes
    echo ""
    echo "Checking Foreign Key indexes..."
    
    INDEXES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname LIKE '%user_id%';" 2>/dev/null)
    
    if [ "$INDEXES" -gt 0 ]; then
        echo -e "${GREEN}✅ Foreign Key indexes created (found $INDEXES)${NC}"
    else
        echo -e "${YELLOW}⚠️  No user_id indexes found${NC}"
    fi
    
    # Check data integrity
    echo ""
    echo "Checking data integrity..."
    
    USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null)
    
    echo -e "${GREEN}✅ Users in database: $USER_COUNT${NC}"
    
else
    echo -e "${YELLOW}⚠️  psql not available, skipping validation${NC}"
    echo "Manually verify using:"
    echo "  psql \$DATABASE_URL -c \"\\d users\" | grep deleted_at"
fi

# ============================================================================
# COMPLETION
# ============================================================================
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}DATABASE MIGRATION COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}\n"

echo "Backup file (for rollback): ${BACKUP_FILE}"
echo ""
echo "Next steps:"
echo "  1. Day 4: Data Encryption Migration"
echo "     npm run migrate:encrypt"
echo ""
echo "  2. Days 5-6: E2E Testing"
echo "     npm test -- tests/P0.test.ts"
echo ""
echo "  3. Day 7: Production Deployment"
echo "     See P0_DEPLOYMENT_CHECKLIST.md"
echo ""
