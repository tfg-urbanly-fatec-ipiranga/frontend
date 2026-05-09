import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TermsPage.css';
import React from 'react';

const TermsPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Elegibilidade',
      content: `O uso da plataforma Urbanly é permitido exclusivamente para usuários com idade igual ou superior a 18 anos. Essa restrição existe devido à possibilidade de exibição de estabelecimentos que envolvam consumo de bebidas alcoólicas, eventos noturnos ou ambientes com classificação etária restrita. Ao utilizar a plataforma, o usuário declara possuir idade compatível com as exigências legais aplicáveis.`
    },
    {
      title: '2. Finalidade da Plataforma',
      content: `O Urbanly é uma plataforma digital destinada à descoberta de estabelecimentos de lazer por meio de buscas baseadas em características subjetivas, denominadas "vibes". Seu objetivo é facilitar a busca, exploração e descoberta de novos locais alinhados às preferências individuais dos usuários. O Urbanly não realiza reservas, pagamentos ou qualquer intermediação comercial entre usuários e estabelecimentos.`
    },
    {
      title: '3. Cadastro e Responsabilidade do Usuário',
      content: `Para acessar determinadas funcionalidades, poderá ser necessário realizar cadastro. O usuário compromete-se a fornecer informações verdadeiras, completas e atualizadas, sendo integralmente responsável pela segurança de sua conta, sigilo de credenciais e atividades realizadas sob seu acesso.`
    },
    {
      title: '4. Uso Adequado da Plataforma',
      content: `É proibido utilizar o Urbanly para fins ilegais, fraudulentos ou que violem direitos de terceiros. Também é vedada a publicação de avaliações falsas, conteúdos ofensivos, discriminatórios ou qualquer informação que comprometa a integridade da comunidade. O descumprimento poderá resultar em suspensão ou exclusão da conta.`
    },
    {
      title: '5. Informações dos Estabelecimentos',
      content: `As informações exibidas são alimentadas pela plataforma e podem sofrer alterações. O Urbanly não garante disponibilidade, funcionamento contínuo ou manutenção das condições informadas pelos estabelecimentos. Recomenda-se a confirmação prévia junto ao local.`
    },
    {
      title: '6. Avaliações e Comentários',
      content: `Usuários podem publicar avaliações e comentários desde que observem princípios éticos e legais. Conteúdos considerados inadequados poderão ser removidos sem aviso prévio.`
    },
    {
      title: '7. Limitação de Responsabilidade',
      content: `O Urbanly atua exclusivamente como plataforma informativa. Não se responsabiliza por experiências individuais vivenciadas nos estabelecimentos, alterações operacionais, divergências de informações ou quaisquer danos decorrentes da utilização de serviços oferecidos por terceiros.`
    },
    {
      title: '8. Alterações nos Termos',
      content: `Os presentes Termos de Uso poderão ser atualizados periodicamente para adequação legal, técnica ou funcional. Recomenda-se a consulta periódica desta página.`
    },
    {
      title: '9. Contato',
      content: `Dúvidas, sugestões ou solicitações poderão ser encaminhadas para: contato@urbanly.com`
    }
  ];

  return (
    <div className="terms-page">
      <header className="terms-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>

        <div className="brand-text">Urbanly</div>
      </header>

      <main className="terms-content">
        <section className="terms-hero">
          <div className="terms-hero-icon">
            <FileText size={28} />
          </div>

          <h1>Termos de Uso</h1>
          <p>Última atualização: Maio de 2026</p>
        </section>

        {sections.map((section, index) => (
          <div key={index} className="terms-card">
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
};

export default TermsPage;