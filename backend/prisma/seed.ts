import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@marmitas.com' },
    update: {},
    create: {
      nome: 'Administradora',
      email: 'admin@marmitas.com',
      senhaHash,
    },
  });
  console.log('Admin criado:', admin.email, '(senha: admin123)');

  const hoje = new Date();
  const fimSemana = new Date(hoje);
  fimSemana.setDate(fimSemana.getDate() + 6);

  const cardapio = await prisma.cardapio.create({
    data: {
      semanaInicio: hoje,
      semanaFim: fimSemana,
      itens: {
        create: [
          { sabor: 'Frango com legumes', descricao: 'Peito de frango grelhado com legumes salteados', preco: 22.9, qtdDisponivel: 30 },
          { sabor: 'Carne de panela', descricao: 'Carne bovina cozida com molho', preco: 25.9, qtdDisponivel: 20 },
          { sabor: 'Strogonoff', descricao: 'Strogonoff de frango com arroz e batata palha', preco: 24.9, qtdDisponivel: 15 },
        ],
      },
    },
    include: { itens: true },
  });
  console.log('Cardápio de exemplo criado com', cardapio.itens.length, 'itens');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
