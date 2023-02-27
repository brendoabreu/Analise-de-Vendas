const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');
const listaClientes = DF.readFileSync('clients.csv').parseCSV();
const listaVendedores = DF.readFileSync('sellers.csv').parseCSV();

const escreveArquivo = (dados) => {
    dados.asCSV().writeFile('2.1 vendas-por-vendedores-decrescente.csv');
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

let pedidosOrdemDecrescente = qtdePedidosPorCliente.orderByDescending(row => row.numPedidos);
let pedidosOrdemCrescente = qtdePedidosPorCliente.orderBy(row => row.numPedidos);

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

let vendasOrdemDecrescente = qntdeVendasPorVendedor.orderByDescending(row => row.numVendas);
let vendasOrdemCrescente = qntdeVendasPorVendedor.orderBy(row => row.numVendas);

escreveArquivo(vendasOrdemDecrescente);