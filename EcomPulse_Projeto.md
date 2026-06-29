# EcomPulse - Documentacao do Projeto

## Visao geral

O EcomPulse e um painel local em HTML para analisar planilhas de produtos da loja Net Eletrica e de outras contas adicionadas pelo usuario. O projeto roda diretamente no navegador, sem servidor, usando arquivos CSV, XLSX ou XLS importados manualmente.

Arquivo principal:

- `ecompulse_dark.html`

## Objetivo

Criar um dashboard profissional, moderno, minimalista e multifuncional para acompanhar:

- Faturamento por produto, categoria e periodo.
- Unidade vendida por produto.
- Ritmo dos anuncios.
- Anuncios com e sem clips.
- Produtos que precisam de ajustes.
- Produtos favoritos.
- Comparacao entre relatorios importados.
- Contas separadas para analisar outras lojas sem perder os dados ja importados.

## Como usar

1. Abra `ecompulse_dark.html` no navegador.
2. Clique em `Novo arquivo` para importar uma planilha CSV, XLSX ou XLS.
3. Confirme o mapeamento das colunas.
4. Navegue pelas abas do dashboard.
5. Use o icone/logo EcomPulse para adicionar ou trocar contas.

## Estrutura das telas

### Header

A header possui:

- Logo `EcomPulse`, que tambem funciona como botao para abrir o gerenciador de contas.
- Botao `Home`, que volta ao inicio do dashboard quando ja existem dados carregados.
- Botao `Favoritos`, para abrir os anuncios favoritados.
- Botao `Categorias`, para abrir a analise por categorias.
- Botao de tema claro/escuro.
- Botao `Novo arquivo`, para importar um novo relatorio.

### Visao geral

A aba `Visao geral` mostra:

- Receita por categoria, considerando apenas as principais categorias e agrupando o restante.
- Plano de acao.
- Top produtos por receita.
- Prioridade de melhoria.

O antigo bloco de clips foi removido da visao geral e substituido por `Plano de acao`.

### Plano de acao

O plano de acao destaca:

- Produtos com menos de 7 imagens.
- Produtos sem clips.
- Produtos em queda.

Regra atual:

- Produtos com menos de 7 imagens precisam de ajuste.

### Ritmo

A aba `Ritmo` classifica os anuncios em:

- Crescente.
- Estavel.
- Queda.
- Sem clips.

Os cards sao clicaveis. Ao clicar em um card, a tabela mostra apenas os anuncios daquele grupo.

Tambem existe ordenacao por faturamento:

- Maior faturamento.
- Menor faturamento.

### Categorias

A aba `Categorias` permite:

- Ver todas as categorias.
- Clicar em uma categoria.
- Ver os anuncios pertencentes a categoria selecionada.
- Ordenar os anuncios da categoria por faturamento maior ou menor.
- Ver o ritmo da categoria.
- Ver valor gerado pela categoria.
- Ver quantos anuncios existem na categoria.
- Ver quantos anuncios da categoria estao sem clips.

### Ranking

A aba `Ranking` mostra:

- Produto e ID.
- Categoria.
- Preco atual.
- Receita.
- Unidade vendida.
- Ritmo.
- Nota.
- Status.

Tambem possui filtro por categoria.

### Todos os produtos

A aba `Todos os produtos` mostra:

- Produto e ID.
- Preco atual.
- Preco anterior.
- Receita.
- Unidade.
- Ritmo.
- Quantidade de imagens.
- Clips.

O link `Abrir loja` foi removido desta tabela.

### Favoritos

O usuario pode favoritar anuncios usando o icone de estrela nas tabelas.

A aba `Favoritos` mostra:

- Quantidade de anuncios favoritos.
- Receita dos favoritos.
- Unidade vendida dos favoritos.
- Favoritos crescentes.
- Quantidade com clips e sem clips.
- Lista de anuncios favoritos.

### Comparacao

A aba `Comparacao` compara dois relatorios importados.

Ela mostra:

- Receita.
- Unidade.
- Produtos.
- Ticket medio.
- Variacoes por produto.
- Preco anterior.
- Preco atual.
- Ritmo.

Tambem existe botao para excluir relatorios.

## Regras de negocio

### Receita por periodo

O painel permite alternar a receita entre:

- Ultimos 30 dias.
- Ultimos 15 dias.
- Ultimos 7 dias.

Se a planilha possuir colunas especificas de 15 ou 7 dias, o painel usa esses valores.

Se nao possuir, o painel estima proporcionalmente com base nos 30 dias:

- 15 dias = receita 30 dias * 15 / 30.
- 7 dias = receita 30 dias * 7 / 30.

### Unidade por periodo

A mesma logica vale para unidades vendidas:

- 30 dias usa unidade base.
- 15 dias usa coluna especifica, se existir, ou estimativa.
- 7 dias usa coluna especifica, se existir, ou estimativa.

### Ritmo

O ritmo usa a tendencia percentual do produto.

Classificacao:

- Crescente: tendencia acima de +15%.
- Queda: tendencia abaixo de -15%.
- Estavel: entre -15% e +15%, ou sem dado.

Visual:

- Crescente usa degrade verde.
- Queda usa degrade vermelho.
- Estavel usa degrade azul/cinza.

### Clips

A deteccao de clips foi ajustada para reduzir falsos positivos.

Valores tratados como sem clip:

- vazio.
- `0`.
- `nao`.
- `no`.
- `false`.
- `falso`.
- `sem`.
- `none`.
- `n/a`.
- `sem clip`.
- `sem clipe`.
- `sem cupom`.
- `nao possui`.
- `nao tem`.
- `no clip`.
- `inativo`.
- `inactive`.
- `nao ativo`.
- `not active`.
- `desativado`.
- `expirado`.

Valores tratados como com clip:

- `1`.
- `sim`.
- `yes`.
- `true`.
- `ativo`.
- `active`.
- `com`.
- `possui`.
- `com clip`.
- `com clipe`.
- `clip ativo`.
- `clipe ativo`.
- `possui clip`.
- `possui clipe`.

Quando a coluna de origem indica clip/cupom/video e o valor numerico e maior que zero, o produto tambem e considerado com clip.

### Imagens

Regra atual:

- O minimo necessario sao 7 imagens.
- Produtos com menos de 7 imagens entram no plano de acao.

### Prioridade de melhoria

A prioridade considera:

- Receita do produto.
- Ritmo em queda.
- Ausencia de clips.
- Menos de 7 imagens.

Produtos em queda e com problemas de midia recebem maior prioridade.

## Colunas esperadas na planilha

O painel tenta detectar automaticamente colunas parecidas com:

- Nome do produto.
- ID do produto.
- Preco atual.
- Preco anterior.
- Receita 30 dias.
- Receita 15 dias.
- Receita 7 dias.
- Unidades 30 dias.
- Unidades 15 dias.
- Unidades 7 dias.
- Tendencia.
- Nota.
- Avaliacoes.
- Quantidade de imagens.
- Clip ativo.
- Categoria.

O usuario pode corrigir o mapeamento antes de gerar o dashboard.

## Contas

O logo `EcomPulse` abre o gerenciador de contas.

Funcionalidades:

- Criar nova conta.
- Trocar de conta.
- Manter dados separados por conta.

A conta original `Net Eletrica` preserva os dados ja importados nas chaves antigas de armazenamento local.

Novas contas usam chaves separadas.

## Armazenamento local

O projeto usa `localStorage` do navegador.

Principais dados salvos:

- Historico de relatorios.
- Relatorio ativo.
- Aba ativa.
- Tela atual.
- Tema claro/escuro.
- Favoritos.
- Contas.
- Conta ativa.
- Periodo de receita selecionado.

Como os dados ficam no navegador, limpar dados do site pode apagar historico e favoritos.

## Design

Direcao visual:

- Moderno.
- Minimalista.
- Profissional.
- Multifuncional.
- Tema dark como padrao.
- Tema claro em branco gelo.

Ajustes visuais feitos:

- Cards com bordas discretas.
- Graficos com proporcoes mais controladas.
- No tema claro, sombras dos graficos foram removidas.
- No tema dark, os graficos mantem profundidade/efeito 3D.
- Ritmo usa cores por estado.
- Categorias sao clicaveis e responsivas.

## Graficos

Graficos atuais:

- Receita por categoria.
- Top produtos por receita.
- Prioridade de melhoria.

O antigo grafico de clips saiu da visao geral.

O grafico de categorias foi ajustado para:

- Exibir apenas categorias principais.
- Agrupar restante em `Outros`.
- Usar layout horizontal.
- Melhorar proporcao visual.

## Historico de alteracoes solicitadas

Principais evolucoes feitas durante a conversa:

- Criacao de modelo dark.
- Alternancia manual de tema.
- Persistencia da aba/tela atual.
- Adicao de ID ao lado do produto.
- Inclusao de preco atual e preco anterior.
- Troca de `Dias na loja` por imagens e clips.
- Adicao de link da loja, depois removido da tabela.
- Criacao da coluna `Ritmo`.
- Ajuste de graficos e dashboard.
- Exclusao de relatorios na comparacao.
- Criacao de Favoritos.
- Criacao de Categorias.
- Contas separadas via logo EcomPulse.
- Receita por 30, 15 e 7 dias.
- Plano de acao no lugar de clips na visao geral.
- Regra de 7 imagens minimas.
- Correcao da logica de clips.
- Ordenacao por faturamento nas categorias e no ritmo.

## Arquivos do projeto

- `ecompulse_dark.html`: painel principal.
- `EcomPulse_Projeto.md`: documentacao do projeto em Markdown.

## Proximos passos sugeridos

- Adicionar exportacao PDF/Excel da aba atual.
- Permitir editar manualmente a categoria de um produto.
- Criar filtro global por categoria, ritmo e clips.
- Adicionar busca por ID exato.
- Criar painel de alertas automaticos para produtos em queda.
- Criar backup/importacao do historico salvo no navegador.
