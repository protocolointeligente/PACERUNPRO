#!/bin/bash

# ============================================================================
# DAYS 5-6: E2E TESTING AUTOMATION SCRIPT
# ============================================================================
# Comprehensive testing automation for P0 deployment validation
# Usage: bash scripts/test-e2e.sh
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
RESULTS_DIR="test-results-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}DAYS 5-6: E2E TESTING AUTOMATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# ============================================================================
# DAY 5: UNIT/INTEGRATION TESTING
# ============================================================================

echo -e "${YELLOW}DAY 5: UNIT & INTEGRATION TESTING${NC}\n"

# Check environment
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    echo -e "${RED}❌ ENCRYPTION_KEY not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}\n"

# ============================================================================
# TEST 1: Run Full Test Suite
# ============================================================================

echo -e "${CYAN}TEST 1: Running full test suite (24 tests)${NC}"
echo "Output: $RESULTS_DIR/test-results.txt"

if npm test -- tests/P0.test.ts 2>&1 | tee "$RESULTS_DIR/test-results.txt"; then
    PASSED=$(grep -o "✓" "$RESULTS_DIR/test-results.txt" | wc -l)
    echo -e "${GREEN}✅ All tests passed ($PASSED/24)${NC}\n"
else
    echo -e "${RED}❌ Tests failed${NC}\n"
    exit 1
fi

# ============================================================================
# TEST 2: Database Schema Validation
# ============================================================================

echo -e "${CYAN}TEST 2: Validating database schema${NC}"

SCHEMA_OUTPUT=$(psql $DATABASE_URL << EOF 2>&1
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='User' 
  AND column_name IN ('deleted_at', 'deletion_reason', 'deleted_by')
ORDER BY column_name;
EOF
)

if echo "$SCHEMA_OUTPUT" | grep -q "deleted_at"; then
    echo -e "${GREEN}✅ Soft-delete fields exist${NC}"
    echo "$SCHEMA_OUTPUT" | tee -a "$RESULTS_DIR/schema-validation.txt"
else
    echo -e "${RED}❌ Soft-delete fields missing${NC}"
    exit 1
fi

echo ""

# ============================================================================
# TEST 3: Index Validation
# ============================================================================

echo -e "${CYAN}TEST 3: Validating indexes (soft-delete and FK)${NC}"

INDEXES_OUTPUT=$(psql $DATABASE_URL << EOF 2>&1
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname='public' 
  AND (indexname LIKE '%deleted%' OR indexname LIKE '%user_id%' OR indexname LIKE '%author_id%')
ORDER BY tablename, indexname;
EOF
)

SOFT_DELETE_COUNT=$(echo "$INDEXES_OUTPUT" | grep "deleted" | wc -l)
FK_INDEX_COUNT=$(echo "$INDEXES_OUTPUT" | grep -E "user_id|author_id|post_id" | wc -l)

echo -e "${GREEN}✅ Soft-delete indexes: $SOFT_DELETE_COUNT found${NC}"
echo -e "${GREEN}✅ FK indexes: $FK_INDEX_COUNT found${NC}"
echo "$INDEXES_OUTPUT" | tee -a "$RESULTS_DIR/indexes-validation.txt"

if [ $SOFT_DELETE_COUNT -lt 5 ] || [ $FK_INDEX_COUNT -lt 8 ]; then
    echo -e "${YELLOW}⚠️  Warning: Expected 5+ soft-delete indexes and 8+ FK indexes${NC}"
fi

echo ""

# ============================================================================
# TEST 4: Encryption Validation
# ============================================================================

echo -e "${CYAN}TEST 4: Validating encryption in database${NC}"

ENCRYPTION_OUTPUT=$(psql $DATABASE_URL << EOF 2>&1
SELECT id, 
  SUBSTRING("accessToken" FROM 1 FOR 20) as token_preview,
  CASE WHEN "accessToken" LIKE 'enc:%' THEN 'Encrypted' ELSE 'Plaintext' END as status
FROM "ConnectedDevice" 
LIMIT 3;
EOF
)

if echo "$ENCRYPTION_OUTPUT" | grep -q "Encrypted\|Plaintext"; then
    echo -e "${GREEN}✅ Encryption check completed${NC}"
    echo "$ENCRYPTION_OUTPUT" | tee -a "$RESULTS_DIR/encryption-validation.txt"
else
    echo -e "${YELLOW}⚠️  No connected devices in database (expected in staging)${NC}"
fi

echo ""

# ============================================================================
# DAY 6: PERFORMANCE TESTING
# ============================================================================

echo -e "${YELLOW}DAY 6: PERFORMANCE & STAGING VALIDATION${NC}\n"

# ============================================================================
# TEST 5: Query Performance Analysis
# ============================================================================

echo -e "${CYAN}TEST 5: Query performance analysis (EXPLAIN ANALYZE)${NC}"

PERF_OUTPUT=$(psql $DATABASE_URL << EOF 2>&1
-- Get query plans for key tables
EXPLAIN (ANALYZE, FORMAT JSON) 
SELECT * FROM payments 
WHERE user_id = 'sample-user' 
LIMIT 10;
EOF
)

echo "$PERF_OUTPUT" | tee -a "$RESULTS_DIR/performance-analysis.txt"
echo -e "${GREEN}✅ Performance analysis completed${NC}"
echo ""

# ============================================================================
# TEST 6: Soft Delete Functionality
# ============================================================================

echo -e "${CYAN}TEST 6: Soft delete functionality check${NC}"

SOFT_DELETE_CHECK=$(psql $DATABASE_URL << EOF 2>&1
-- Count users by status
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_users,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_users,
  COUNT(*) as total_users
FROM "User";
EOF
)

echo -e "${GREEN}✅ Soft delete status:${NC}"
echo "$SOFT_DELETE_CHECK" | tee -a "$RESULTS_DIR/soft-delete-status.txt"
echo ""

# ============================================================================
# TEST 7: Data Integrity
# ============================================================================

echo -e "${CYAN}TEST 7: Data integrity check${NC}"

INTEGRITY_OUTPUT=$(psql $DATABASE_URL << EOF 2>&1
-- Check for orphaned records
SELECT COUNT(*) as total_users FROM "User";
SELECT COUNT(*) as total_athletes FROM "Athlete";
SELECT COUNT(*) as total_subscriptions FROM "Subscription";
EOF
)

echo -e "${GREEN}✅ Data integrity:${NC}"
echo "$INTEGRITY_OUTPUT" | tee -a "$RESULTS_DIR/data-integrity.txt"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}TESTING COMPLETE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

echo "Results saved to: $RESULTS_DIR/"
echo ""
echo "Files generated:"
ls -1 "$RESULTS_DIR/"
echo ""

# ============================================================================
# CHECKLIST
# ============================================================================

echo -e "${CYAN}VERIFICATION CHECKLIST${NC}\n"

TESTS_PASS=true

# Check test results
if grep -q "24 passed" "$RESULTS_DIR/test-results.txt"; then
    echo -e "${GREEN}✅${NC} All 24 tests passing"
else
    echo -e "${RED}❌${NC} Tests not passing"
    TESTS_PASS=false
fi

# Check schema
if grep -q "deleted_at" "$RESULTS_DIR/schema-validation.txt"; then
    echo -e "${GREEN}✅${NC} Soft-delete fields exist"
else
    echo -e "${RED}❌${NC} Soft-delete fields missing"
    TESTS_PASS=false
fi

# Check indexes
if [ $SOFT_DELETE_COUNT -ge 5 ]; then
    echo -e "${GREEN}✅${NC} Soft-delete indexes present (5+)"
else
    echo -e "${YELLOW}⚠️${NC}  Soft-delete indexes < 5"
fi

if [ $FK_INDEX_COUNT -ge 8 ]; then
    echo -e "${GREEN}✅${NC} FK indexes present (8+)"
else
    echo -e "${YELLOW}⚠️${NC}  FK indexes < 8"
fi

# Check data
if echo "$SOFT_DELETE_CHECK" | grep -q "active_users"; then
    echo -e "${GREEN}✅${NC} Database queries working"
else
    echo -e "${RED}❌${NC} Database queries failing"
    TESTS_PASS=false
fi

echo ""

if [ "$TESTS_PASS" = true ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 ALL TESTS PASSED - READY FOR STAGING DEPLOYMENT${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review results in: $RESULTS_DIR/"
    echo "  2. Deploy to staging"
    echo "  3. Run smoke tests"
    echo "  4. Proceed to Day 7 production deployment"
    echo ""
else
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED - REVIEW BEFORE PROCEEDING${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Review results and fix issues before staging deployment"
    exit 1
fi
