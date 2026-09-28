CODEDARK STORE - VERCEL

Deploy direto deste repositório (GitHub: 01CodeDark/Site-CodeDark).

COMO FUNCIONA
- Vercel detecta o framework Vite com o vercel.json na raiz (build e output já configurados).
- A API fica em /api (função serverless api/[[route]].js) usando Neon Postgres.
- Pagamento: PIX manual. O cliente paga com sua chave e avisa no chat; você confere no banco e clica "Liberar" na aba Pedidos.

VARIÁVEL DE AMBIENTE NECESSÁRIA (Settings > Environment Variables):
- DATABASE_URL: connection string do Neon (neon.tech)

PASSO A PASSO DO PRIMEIRO USO
1. Configure DATABASE_URL na Vercel e faça redeploy.
2. Entre no site e crie sua conta PRIMEIRO: a primeira conta criada vira administrador.
3. No painel /admin, aba Pagamento: cadastre sua chave PIX.
4. Crie categorias e produtos; marque "Publicado" para aparecer na loja.
5. Nas vendas: cliente paga o PIX e avisa no chat, você clica "Liberar" e o download abre pra ele.
