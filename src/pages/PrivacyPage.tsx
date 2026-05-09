import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PrivacyPage.css';

const PrivacyPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Dados Coletados',
      content: `O Urbanly poderá coletar dados fornecidos diretamente pelo usuário, como nome, e-mail, senha criptografada, data de nascimento e preferências de busca. Também poderão ser registrados dados gerados pelo uso da plataforma, incluindo histórico de buscas, interações com estabelecimentos, avaliações e comentários, além de informações técnicas como tipo de dispositivo, navegador, endereço IP, data e horário de acesso.`
    },
    {
      title: '2. Finalidade da Coleta',
      content: `Os dados coletados são utilizados para autenticação, personalização da experiência, melhoria da busca por vibes, manutenção da segurança da plataforma e aprimoramento contínuo dos serviços oferecidos.`
    },
    {
      title: '3. Compartilhamento de Dados',
      content: `O Urbanly não comercializa dados pessoais. As informações poderão ser compartilhadas apenas quando exigidas por obrigação legal ou quando necessárias para o funcionamento técnico da plataforma.`
    },
    {
      title: '4. Armazenamento e Segurança',
      content: `Os dados são armazenados com medidas técnicas adequadas de proteção, incluindo criptografia e práticas de segurança digital. Apesar dos esforços empregados, nenhum sistema digital é completamente imune a riscos.`
    },
    {
      title: '5. Direitos do Usuário',
      content: `Nos termos da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), o usuário poderá solicitar acesso, correção, exclusão, portabilidade de seus dados e revogação do consentimento.`
    },
    {
      title: '6. Exclusão da Conta',
      content: `O usuário poderá solicitar a exclusão de sua conta a qualquer momento. Alguns dados poderão ser mantidos apenas quando houver obrigação legal ou necessidade técnica justificada.`
    },
    {
      title: '7. Cookies e Tecnologias Semelhantes',
      content: `O Urbanly poderá utilizar cookies e tecnologias semelhantes para autenticação, análise de desempenho e personalização da experiência do usuário.`
    },
    {
      title: '8. Restrição Etária',
      content: `A plataforma é destinada exclusivamente a usuários maiores de 18 anos. Contas identificadas em desacordo com essa exigência poderão ser removidas.`
    },
    {
      title: '9. Alterações desta Política',
      content: `Esta Política de Privacidade poderá ser atualizada periodicamente para adequação legal, técnica ou funcional.`
    },
    {
      title: '10. Contato',
      content: `Para solicitações relacionadas à privacidade e proteção de dados: privacidade@urbanly.com`
    }
  ];

  return (
    <div className="privacy-page">
      <header className="privacy-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>

        <div className="brand-text">Urbanly</div>
      </header>

      <main className="privacy-content">
        <section className="privacy-hero">
          <div className="privacy-hero-icon">
            <ShieldCheck size={28} />
          </div>

          <h1>Política de Privacidade</h1>
          <p>Última atualização: Maio de 2026</p>
        </section>

        {sections.map((section, index) => (
          <div key={index} className="privacy-card">
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
};

export default PrivacyPage;