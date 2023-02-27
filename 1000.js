const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');
const listaClientes = DF.readFileSync('clients.csv').parseCSV();
const listaVendedores = DF.readFileSync('sellers.csv').parseCSV();
const listaProdutos = DF.readFileSync('products.csv').parseCSV().parseFloats('preco');

const escreveArquivo = (dados) => {
    dados.asCSV().writeFile('3.1 ranking-vendas-produtos-valor.csv');
}

let pedidosClientes = listaPedidos
    .groupBy(row => row['cliente'])
    .select(group => ({
        idCliente: group.first()['cliente'],
        totalPedidos: group.deflate(row => row['quantidade']).sum(),
    }))
    .inflate();

let qtdePedidosPorCliente = pedidosClientes.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left,right) => {
        return {idCliente: left.idCliente, nomeCliente: right.nome, numPedidos: left.totalPedidos}
    }
);

let pedidosClientesOrdemDecrescente = qtdePedidosPorCliente.orderByDescending(row => row.numPedidos);
let pedidosClientesOrdemCrescente = qtdePedidosPorCliente.orderBy(row => row.numPedidos);

let pedidosVendedor = listaPedidos
    .groupBy(row => row['vendedor'])
    .select(group => ({
        idVendedor: group.first()['vendedor'],
        totalVendas: group.deflate(row => row['quantidade']).sum(),
    }))
    .inflate();

let qntdeVendasPorVendedor = pedidosVendedor.join(
    listaVendedores,
    (left) => left.idVendedor,
    (right) => right.id,
    (left,right) => {
        return {idVendedor: left.idVendedor, nomeVendedor: right.nome, numVendas: left.totalVendas}
    }
);

let vendasVendedorOrdemDecrescente = qntdeVendasPorVendedor.orderByDescending(row => row.numVendas);
let vendasVendedorOrdemCrescente = qntdeVendasPorVendedor.orderBy(row => row.numVendas);

let pedidosProdutos = listaPedidos
    .groupBy(row => row['produto'])
    .select(group => ({
        idProduto: group.first()['produto'],
        numPedidos: group.deflate(row => row['quantidade']).sum()
    }))
    .inflate();

let qntdeVendasPorProduto = pedidosProdutos.join(
    listaProdutos,
    (left) => left.idProduto,
    (right) => right.id,
    (left,right) => {
        return {idProduto: left.idProduto, nomeProduto: right.nome, numPedidos: left.numPedidos, valor: ((right.preco*left.numPedidos).toFixed(2))}
    }
);

let vendasProdutoOrdemDecrescente = qntdeVendasPorProduto.orderByDescending(row => row.numPedidos);
let vendasProdutoOrdemCrescente = qntdeVendasPorProduto.orderBy(row => row.numPedidos);

let valorProdutoOrdemDecrescente = qntdeVendasPorProduto.orderByDescending(row => row.valor);
let valorProdutoOrdemCrescente = qntdeVendasPorProduto.orderBy(row => row.valor);

escreveArquivo(valorProdutoOrdemDecrescente);