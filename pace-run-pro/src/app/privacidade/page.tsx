import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Política de Privacidade — Pace Run Pro",
  description: "Política de Privacidade e tratamento de dados pessoais da plataforma Pace Run Pro, em conformidade com a LGPD.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-text">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-text-muted">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size={32} />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12 pb-24">
        <h1 className="font-display text-3xl font-extrabold text-text">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-text-muted">Última atualização: 15 de junho de 2026</p>

        <div className="mt-8 space-y-8">
          <Section title="1. Introdução e Compromisso com a LGPD">
            <p>
              A Pace Run Pro respeita a sua privacidade e está comprometida com a proteção dos seus
              dados pessoais, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados —
              LGPD). Esta Política descreve quais dados coletamos, como e por que os utilizamos, com
              quem podem ser compartilhados e quais são os seus direitos como titular de dados.
            </p>
          </Section>

          <Section title="2. Quem Somos (Controlador dos Dados)">
            <p>
              O controlador dos dados pessoais tratados na Plataforma é Ricardo Luiz Pace Júnior,
              responsável técnico pela Pace Run Pro (CREF 014626-G/MG), que pode ser contatado pelo
              e-mail{" "}
              <a href="mailto:privacidade@pacerunpro.com.br" className="font-semibold text-primary hover:text-primary/80">
                privacidade@pacerunpro.com.br
              </a>
              .
            </p>
          </Section>

          <Section title="3. Dados que Coletamos">
            <p>Coletamos as seguintes categorias de dados, conforme o seu perfil de uso:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-text">Dados de cadastro:</strong> nome, e-mail, senha
                (armazenada de forma criptografada), telefone e tipo de perfil (atleta, treinador,
                assessoria ou administrador).
              </li>
              <li>
                <strong className="text-text">Dados de saúde e desempenho:</strong> peso, altura, nível
                de experiência, objetivos, resultados de testes físicos, frequência cardíaca, percepção
                de esforço (RPE), check-ins de sono, fadiga, dor e humor, e histórico de treinos.
              </li>
              <li>
                <strong className="text-text">Dados de pagamento:</strong> informações sobre planos
                contratados, histórico de cobranças e status de pagamento. Os dados de cartão de
                crédito são processados diretamente por provedores de pagamento e não são armazenados
                pela Pace Run Pro.
              </li>
              <li>
                <strong className="text-text">Dados de uso e dispositivo:</strong> endereço IP, tipo de
                navegador, sistema operacional, páginas acessadas e cookies (ver seção 10).
              </li>
            </ul>
          </Section>

          <Section title="4. Finalidades do Tratamento">
            <p>Utilizamos seus dados pessoais para:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Criar e gerenciar sua conta e autenticação na Plataforma;</li>
              <li>
                Disponibilizar funcionalidades de prescrição, acompanhamento e periodização de treinos
                entre atletas e treinadores/assessorias;
              </li>
              <li>Processar pagamentos, assinaturas, planos e vouchers de desconto;</li>
              <li>Enviar comunicações sobre treinos, cobranças, novidades e suporte;</li>
              <li>Cumprir obrigações legais e regulatórias; e</li>
              <li>Melhorar a segurança, desempenho e experiência da Plataforma.</li>
            </ul>
          </Section>

          <Section title="5. Base Legal (Art. 7º da LGPD)">
            <p>O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-text">Execução de contrato</strong> — para viabilizar o uso da
                Plataforma e a relação entre atletas e treinadores/assessorias;
              </li>
              <li>
                <strong className="text-text">Consentimento</strong> — para dados sensíveis de saúde
                (ex.: peso, frequência cardíaca, percepção de esforço) e para cookies não essenciais;
              </li>
              <li>
                <strong className="text-text">Cumprimento de obrigação legal ou regulatória</strong> —
                por exemplo, obrigações fiscais relacionadas a pagamentos; e
              </li>
              <li>
                <strong className="text-text">Legítimo interesse</strong> — para prevenção a fraudes e
                segurança da Plataforma.
              </li>
            </ul>
          </Section>

          <Section title="6. Compartilhamento de Dados">
            <p>Seus dados podem ser compartilhados nas seguintes situações:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Com o seu treinador ou assessoria vinculado, para que possa acompanhar seu treino e
                desempenho;
              </li>
              <li>
                Com provedores de infraestrutura, hospedagem, autenticação (incluindo login via Google)
                e processamento de pagamentos, estritamente para viabilizar o funcionamento da
                Plataforma;
              </li>
              <li>Com autoridades públicas, quando exigido por lei, ordem judicial ou regulatória; e</li>
              <li>
                Em caso de reorganização societária (fusão, aquisição ou venda de ativos), sempre
                mantendo o mesmo nível de proteção previsto nesta Política.
              </li>
            </ul>
            <p>A Pace Run Pro não vende dados pessoais a terceiros.</p>
          </Section>

          <Section title="7. Retenção e Eliminação">
            <p>
              Mantemos seus dados pessoais enquanto sua conta estiver ativa ou pelo tempo necessário
              para cumprir as finalidades descritas nesta Política, incluindo obrigações legais,
              fiscais e regulatórias. Após o término do tratamento, os dados são eliminados ou
              anonimizados, exceto quando a retenção for exigida por lei.
            </p>
            <p>
              Você pode solicitar a exclusão da sua conta e dos dados associados a qualquer momento,
              observadas as exceções legais de retenção.
            </p>
          </Section>

          <Section title="8. Segurança da Informação">
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados pessoais contra
              acessos não autorizados, perda, alteração ou destruição, incluindo criptografia de senhas,
              controle de acesso por perfil e conexões seguras (HTTPS/TLS). Nenhum sistema é
              completamente livre de riscos; em caso de incidente de segurança que possa acarretar risco
              relevante, comunicaremos os titulares e a Autoridade Nacional de Proteção de Dados (ANPD)
              conforme exigido pela LGPD.
            </p>
          </Section>

          <Section title="9. Direitos do Titular (Art. 18 da LGPD)">
            <p>Você, como titular dos dados, tem direito a:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar seus dados;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço;</li>
              <li>Solicitar a eliminação dos dados tratados com consentimento;</li>
              <li>Obter informação sobre compartilhamento de dados; e</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p>
              Para exercer esses direitos, entre em contato pelo e-mail{" "}
              <a href="mailto:privacidade@pacerunpro.com.br" className="font-semibold text-primary hover:text-primary/80">
                privacidade@pacerunpro.com.br
              </a>
              . Responderemos às solicitações dentro dos prazos previstos pela LGPD.
            </p>
          </Section>

          <Section title="10. Cookies e Tecnologias Semelhantes">
            <p>
              Utilizamos cookies essenciais para o funcionamento da Plataforma (como autenticação e
              preferências de tema) e, quando aplicável, cookies de desempenho e análise para entender
              como a Plataforma é utilizada. Você pode gerenciar suas preferências de cookies não
              essenciais a partir do aviso de cookies exibido no primeiro acesso, e ajustar as
              configurações do seu navegador para bloquear cookies — o que pode afetar algumas
              funcionalidades da Plataforma.
            </p>
          </Section>

          <Section title="11. Transferência Internacional de Dados">
            <p>
              Alguns dos prestadores de serviço utilizados pela Pace Run Pro (como provedores de
              hospedagem, autenticação e pagamento) podem processar dados em servidores localizados fora
              do Brasil. Nesses casos, buscamos garantir que tais transferências ocorram em conformidade
              com a LGPD, mediante mecanismos adequados de proteção exigidos pela legislação.
            </p>
          </Section>

          <Section title="12. Alterações desta Política">
            <p>
              Esta Política de Privacidade pode ser atualizada periodicamente. A versão mais recente
              estará sempre disponível nesta página, com a data da última atualização indicada no
              topo. Em caso de alterações relevantes, notificaremos os usuários pelos canais habituais
              da Plataforma.
            </p>
          </Section>

          <Section title="13. Contato e Encarregado (DPO)">
            <p>
              Para dúvidas, solicitações ou exercício de direitos relacionados a esta Política de
              Privacidade, entre em contato com o Encarregado de Proteção de Dados (DPO) pelo e-mail{" "}
              <a href="mailto:privacidade@pacerunpro.com.br" className="font-semibold text-primary hover:text-primary/80">
                privacidade@pacerunpro.com.br
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
    </>
  );
}
