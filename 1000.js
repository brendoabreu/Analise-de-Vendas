const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');
const listaClientes = DF.readFileSync('clients.csv').parseCSV();
const listaVendedores = DF.readFileSync('sellers.csv').parseCSV();
const listaProdutos = DF.readFileSync('products.csv').parseCSV().parseFloats('preco');

const escreveArquivo = (dados) => {
    dados.asCSV().writeFile('4.0-cliente-mais-comprou.csv');
}

let pedidosClientes = listaPedidos
    .groupBy(row => row['cliente'])
    .select(group => ({
        idCliente: group.first()['cliente'],
        totalPedidos: group.deflate(row => row['quantidade']).sum(),
    }))
    .inflate(
);

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
    .inflate(
);

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
    .inflate(
);

let qntdeVendasPorProduto = pedidosProdutos.join(
    listaProdutos,
    (left) => left.idProduto,
    (right) => right.id,
    (left,right) => {
        return {idProduto: left.idProduto, nomeProduto: right.nome, numPedidos: left.numPedidos, valor: (right.preco*left.numPedidos)};
    }
);

let vendasProdutoOrdemDecrescente = qntdeVendasPorProduto.orderByDescending(row => row.numPedidos);
let vendasProdutoOrdemCrescente = qntdeVendasPorProduto.orderBy(row => row.numPedidos);

let valorProdutoOrdemDecrescente = qntdeVendasPorProduto.orderByDescending(row => row.valor);
let valorProdutoOrdemCrescente = qntdeVendasPorProduto.orderBy(row => row.valor);

let produtoMaisVendido = valorProdutoOrdemDecrescente.at(0);

let listaPedidosProdutoMaisVendido = listaPedidos.where(row => row['produto'] === produtoMaisVendido.idProduto);
let qntdProdutoMaisVendidoPorCliente = listaPedidosProdutoMaisVendido
    .groupBy(row => row['cliente'])
    .select(group =>({
        idCliente: group.first()['cliente'],
        qntdeProduto: group.deflate(row => row['quantidade']).sum()
    }))
    .inflate()
    .orderByDescending(row => row.qntdeProduto
);

let listaNomesClientesProdutoMaisVendido = qntdProdutoMaisVendidoPorCliente.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left,right) => {
        return {idCliente: left.idCliente, cliente: right.nome, qntdeProduto: left.qntdeProduto}
    }
)

let qntdProdutoMaisVendidoPorVendedor = listaPedidosProdutoMaisVendido
    .groupBy(row => row['vendedor'])
    .select(group =>({
        idVendedor: group.first()['vendedor'],
        qntdeProduto: group.deflate(row => row['quantidade']).sum()
    }))
    .inflate()
    .orderByDescending(row => row.qntdeProduto
);

let listaNomesVendedoresProdutoMaisVendido = qntdProdutoMaisVendidoPorVendedor.join(
    listaVendedores,
    (left) => left.idVendedor,
    (right) => right.id,
    (left,right) => {
        return {idVendedor: left.idVendedor, vendedor: right.nome, qntdeProduto: left.qntdeProduto}
    }
)

let pedidosComValor = listaPedidos.join(
    listaProdutos,
    (left) => left.produto,
    (right) => right.id,
    (left, right) => {
        return {idProduto: left.produto, idCliente: left.cliente, idVendedor: left.vendedor, quantidade: left.quantidade, valor: (left.quantidade*right.preco)};
    }
);

let rankingClientes = pedidosComValor.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left, right) => {
        return {idCliente: left.idCliente, nomeCliente: right.nome, valor: left.valor};
    })
    .groupBy(row => row['nomeCliente'])
    .select(group =>({
        idCliente: group.first()['idCliente'],
        nomeCliente: group.first()['nomeCliente'],
        valorCompra: group.deflate(row => row['valor']).sum()
    }))
    .inflate()
    .orderByDescending(row => row['valorCompra']
);

let clienteMaisComprou = rankingClientes.head(1);

let rankingVendedores = pedidosComValor.join(
    listaVendedores,
    (left) => left.idVendedor,
    (right) => right.id,
    (left, right) => {
        return {idVendedor: left.idVendedor, nomeVendedor: right.nome, valor: left.valor};
    })
    .groupBy(row => row['nomeVendedor'])
    .select(group =>({
        idVendedor: group.first()['idVendedor'],
        nomeVendedor: group.first()['nomeVendedor'],
        valorCompra: group.deflate(row => row['valor']).sum()
    }))
    .inflate()
    .orderByDescending(row => row['valorCompra']
);

let vendedorMaisVendeu = rankingVendedores.head(1);

let rankingClientesValorPorPedido = pedidosComValor.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left,right) => {
        return {idCliente: left.idCliente, nomeCliente: right.nome, valor: left.valor};
    })
    .orderByDescending(row => row['valor']
);

let clienteMaiorValorPorCompra = rankingClientesValorPorPedido.head(1);

//escreveArquivo(rankingClientesValorPorPedido);
escreveArquivo(clienteMaisComprou);