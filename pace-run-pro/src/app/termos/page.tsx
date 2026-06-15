import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Termos de Uso — Pace Run Pro",
  description: "Termos de Uso da plataforma Pace Run Pro.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-text">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-text-muted">{children}</div>
    </section>
  );
}

export default function TermosPage() {
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
        <h1 className="font-display text-3xl font-extrabold text-text">Termos de Uso</h1>
        <p className="mt-2 text-sm text-text-muted">Última atualização: 15 de junho de 2026</p>

        <div className="mt-8 space-y-8">
          <Section title="1. Aceitação dos Termos">
            <p>
              Ao acessar ou utilizar a plataforma Pace Run Pro (&quot;Plataforma&quot;, &quot;nós&quot; ou &quot;Pace
              Run Pro&quot;), você concorda integralmente com estes Termos de Uso e com a nossa{" "}
              <Link href="/privacidade" className="font-semibold text-primary hover:text-primary/80">
                Política de Privacidade
              </Link>
              . Caso não concorde com algum dos termos aqui descritos, recomendamos que não utilize a
              Plataforma.
            </p>
            <p>
              A Pace Run Pro é operada por Ricardo Luiz Pace Júnior, Técnico em Treinamento Desportivo
              registrado sob o CREF 014626-G/MG, doravante denominado &quot;Responsável Técnico&quot;.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              A Pace Run Pro é uma plataforma digital para gestão de treinos de corrida, voltada a
              treinadores, assessorias esportivas, personal trainers e corredores (atletas). A
              Plataforma oferece recursos como prescrição e periodização de treinos, acompanhamento de
              cargas e desempenho, testes físicos, check-ins de bem-estar, comunidade e gestão de
              alunos/atletas.
            </p>
            <p>
              A Pace Run Pro é uma ferramenta de apoio à gestão e ao acompanhamento de treinos. As
              prescrições, planos e orientações disponibilizadas por meio da Plataforma são de
              responsabilidade do treinador ou profissional que as criou, não substituindo
              acompanhamento médico, nutricional ou de outros profissionais de saúde.
            </p>
          </Section>

          <Section title="3. Cadastro e Conta">
            <p>
              Para utilizar a Plataforma, é necessário criar uma conta com informações verdadeiras,
              completas e atualizadas. Você é responsável por manter a confidencialidade de sua senha e
              por todas as atividades realizadas em sua conta.
            </p>
            <p>
              Cada perfil (atleta, treinador, assessoria ou administrador) possui permissões e recursos
              específicos. É proibido criar contas falsas, utilizar identidade de terceiros sem
              autorização ou compartilhar credenciais de acesso com pessoas não autorizadas.
            </p>
          </Section>

          <Section title="4. Planos, Pagamentos e Cobrança">
            <p>
              A Pace Run Pro oferece planos gratuitos e pagos, com recursos e limites (como número de
              alunos/atletas) que variam conforme o plano contratado. Os valores, periodicidade e
              condições vigentes de cada plano estão sempre disponíveis na página de planos da
              Plataforma.
            </p>
            <p>
              Os pagamentos de planos pagos são processados por meio de provedores de pagamento
              terceirizados. Ao assinar um plano pago, você autoriza a cobrança recorrente do valor
              correspondente até que a assinatura seja cancelada. Caso o número de alunos/atletas
              vinculados a uma conta de treinador ou assessoria exceda o limite do plano contratado, a
              Plataforma poderá migrar automaticamente a assinatura para o plano imediatamente superior
              compatível com o número de alunos cadastrados, com ajuste proporcional da cobrança.
            </p>
            <p>
              Cupons e vouchers de desconto, quando emitidos pela Pace Run Pro ou por treinadores e
              assessorias autorizados, possuem validade, abrangência e condições próprias, descritas no
              momento de sua emissão ou aplicação.
            </p>
          </Section>

          <Section title="5. Cancelamento e Reembolso">
            <p>
              Você pode cancelar sua assinatura a qualquer momento pelo painel da conta. O cancelamento
              encerra a renovação automática, mas o acesso aos recursos pagos permanece disponível até
              o final do período já pago.
            </p>
            <p>
              Eventuais reembolsos seguem a legislação consumerista aplicável, incluindo o direito de
              arrependimento previsto no art. 49 do Código de Defesa do Consumidor para compras
              realizadas fora do estabelecimento comercial, dentro do prazo de 7 (sete) dias corridos
              contados da contratação.
            </p>
          </Section>

          <Section title="6. Uso Adequado e Aviso sobre Saúde">
            <p>
              Atividades físicas, incluindo corrida e treinos de força, envolvem riscos à saúde.
              Recomendamos fortemente a realização de avaliação médica antes de iniciar ou intensificar
              qualquer programa de treinamento. A Pace Run Pro não se responsabiliza por lesões,
              agravos à saúde ou outros danos decorrentes da prática de atividades físicas prescritas
              ou registradas na Plataforma.
            </p>
            <p>
              É proibido utilizar a Plataforma para fins ilícitos, ofensivos, discriminatórios ou que
              violem direitos de terceiros, incluindo no espaço de comunidade e nas interações entre
              usuários.
            </p>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              Todo o conteúdo da Plataforma — incluindo marca, logotipo, layout, código-fonte, textos,
              ícones e materiais de treino disponibilizados pela Pace Run Pro — é protegido por direitos
              de propriedade intelectual e pertence à Pace Run Pro ou a seus licenciantes.
            </p>
            <p>
              Os planos de treino, anotações e dados inseridos por treinadores e atletas permanecem de
              titularidade de quem os criou, sendo a Pace Run Pro apenas a plataforma de hospedagem e
              gestão desses dados, nos termos da nossa Política de Privacidade.
            </p>
          </Section>

          <Section title="8. Integrações com Terceiros">
            <p>
              A Plataforma pode oferecer integrações com serviços de terceiros (como provedores de
              autenticação, pagamento e ferramentas de comunicação). O uso dessas integrações também
              está sujeito aos termos e políticas de privacidade dos respectivos provedores.
            </p>
          </Section>

          <Section title="9. Limitação de Responsabilidade">
            <p>
              A Pace Run Pro é fornecida &quot;como está&quot; e &quot;conforme disponibilidade&quot;. Não
              garantimos que a Plataforma estará livre de erros, interrupções ou indisponibilidades.
              Na máxima extensão permitida pela lei, a Pace Run Pro não será responsável por danos
              indiretos, incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso
              da Plataforma.
            </p>
          </Section>

          <Section title="10. Suspensão e Encerramento">
            <p>
              Podemos suspender ou encerrar o acesso de uma conta que viole estes Termos, pratique
              fraude, inadimplência ou uso indevido da Plataforma, mediante notificação prévia, salvo
              em casos de risco imediato a terceiros ou à segurança da Plataforma.
            </p>
          </Section>

          <Section title="11. Alterações destes Termos">
            <p>
              Estes Termos podem ser atualizados periodicamente para refletir melhorias, mudanças
              legais ou novos recursos da Plataforma. Alterações relevantes serão comunicadas pelos
              canais habituais (e-mail ou avisos na Plataforma) com razoável antecedência.
            </p>
          </Section>

          <Section title="12. Lei Aplicável e Foro">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
              da comarca do domicílio do usuário para dirimir eventuais controvérsias, salvo disposição
              legal em contrário.
            </p>
          </Section>

          <Section title="13. Contato">
            <p>
              Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail{" "}
              <a href="mailto:contato@pacerunpro.com.br" className="font-semibold text-primary hover:text-primary/80">
                contato@pacerunpro.com.br
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
    </>
  );
}
