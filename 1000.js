const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');
const { inflate } = require('zlib');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');
const listaClientes = DF.readFileSync('clients.csv').parseCSV();
const listaVendedores = DF.readFileSync('sellers.csv').parseCSV();
const listaProdutos = DF.readFileSync('products.csv').parseCSV().parseFloats('preco');

let pedidosComValor = listaPedidos.join(
    listaProdutos,
    (left) => left.produto,
    (right) => right.id,
    (left, right) => {
        return {idProduto: parseInt(left.produto), idCliente: parseInt(left.cliente), idVendedor: parseInt(left.vendedor), quantidade: parseInt(left.quantidade), valor: parseFloat((left.quantidade*right.preco).toFixed(2)), data: left.data, dia: new Date(left.data).getDate(), mes: new Date(left.data).getMonth(), ano: new Date(left.data).getFullYear()};
    }
);

const escreveArquivo = (dados) => {
    dados.asCSV().writeFile('teste.csv');
    console.log('Arquivo guardado com sucesso');
}

let pedidosClientes = listaPedidos.groupBy(row => row['cliente'])
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

let pedidosVendedor = listaPedidos.groupBy(row => row['vendedor'])
    .select(group => ({
        idVendedor: group.first()['vendedor'],
        totalVendas: parseFloat(group.deflate(row => row['quantidade']).sum().toFixed(2)),
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

let pedidosProdutos = listaPedidos.groupBy(row => row['produto'])
    .select(group => ({
        idProduto: group.first()['produto'],
        numPedidos: parseFloat(group.deflate(row => row['quantidade']).sum().toFixed(2))
    }))
    .inflate();

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
let qntdProdutoMaisVendidoPorCliente = listaPedidosProdutoMaisVendido.groupBy(row => row['cliente'])
    .select(group =>({
        idCliente: group.first()['cliente'],
        qntdeProduto: parseFloat(group.deflate(row => row['quantidade']).sum().toFixed(2))
    }))
    .inflate()
    .orderByDescending(row => row.qntdeProduto);

let listaNomesClientesProdutoMaisVendido = qntdProdutoMaisVendidoPorCliente.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left,right) => {
        return {idCliente: left.idCliente, cliente: right.nome, qntdeProduto: left.qntdeProduto}
    }
)

let qntdProdutoMaisVendidoPorVendedor = listaPedidosProdutoMaisVendido.groupBy(row => row['vendedor'])
    .select(group =>({
        idVendedor: group.first()['vendedor'],
        qntdeProduto: parseFloat(group.deflate(row => row['quantidade']).sum().toFixed(2))
    }))
    .inflate()
    .orderByDescending(row => row.qntdeProduto);

let listaNomesVendedoresProdutoMaisVendido = qntdProdutoMaisVendidoPorVendedor.join(
    listaVendedores,
    (left) => left.idVendedor,
    (right) => right.id,
    (left,right) => {
        return {idVendedor: left.idVendedor, vendedor: right.nome, qntdeProduto: left.qntdeProduto}
    }
)

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
        valorCompra: parseFloat(group.deflate(row => row['valor']).sum().toFixed(2))
    }))
    .inflate()
    .orderByDescending(row => row['valorCompra']);

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
        valorCompra: parseFloat(group.deflate(row => row['valor']).sum().toFixed(2))
    }))
    .inflate()
    .orderByDescending(row => row['valorCompra']);

let vendedorMaisVendeu = rankingVendedores.head(1);

let rankingClientesValorPorPedido = pedidosComValor.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left,right) => {
        return {idCliente: left.idCliente, nomeCliente: right.nome, valor: left.valor};
    })
    .orderByDescending(row => row['valor']);

let clienteMaiorValorPorCompra = rankingClientesValorPorPedido.head(1);

let rankingVendedoresValorPorPedido = pedidosComValor.join(
    listaVendedores,
    (left) => left.idVendedor,
    (right) => right.id,
    (left,right) => {
        return {idVendedor: left.idVendedor, nomeVendedor: right.nome, valor: left.valor};
    })
    .orderByDescending(row => row['valor']);

let vendedorMaiorValorPorVenda = rankingVendedoresValorPorPedido.head(1);

let pedidosPorPais = pedidosComValor.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left, right) => {
        return {idCliente: right.id, pais: right.pais, idProduto: left.idProduto, quantidade: left.quantidade, valor: left.valor};
});
 

let rankingPedidosPorPais = pedidosPorPais.groupBy(row => row['pais'])
    .select(group =>({
        pais: group.first()['pais'],
        quantidade: parseFloat(group.deflate(row => row['quantidade']).sum().toFixed(2)),
        valor: parseFloat(group.deflate(row => row['valor']).sum().toFixed(2))
    }))
    .inflate()
    .orderByDescending(row => row['valor']);

let rankingProdutosCompradosPorPais = pedidosPorPais.join(
    listaProdutos,
    (left) => left.idProduto,
    (right) => right.id,
    (left, right) => {
        return {pais: left.pais, idProduto: left.idProduto, nomeProduto: right.nome, quantidade: left.quantidade, valor: left.valor}
    })
    .orderBy(row => row['pais'])
    .thenByDescending(row => row['idProduto'])
    .thenByDescending(row => row['quantidade'])
    .groupSequentialBy(row => row['idProduto'])
    .select(group => ({
        pais: group.first()['pais'],
        idProduto: group.first()['idProduto'],
        nomeProduto: group.first()['nomeProduto'],
        quantidade: parseFloat(group.deflate(row => row['quantidade']).sum().toFixed(2)),
        valor: parseFloat(group.deflate(row => row ['valor']).sum().toFixed(2))
    }))
    .orderBy(row => row['pais'])
    .thenByDescending(row => row['quantidade'])
    .groupSequentialBy(row => row['pais'])
    .select(group => ({
        pais: group.first()['pais'],
        nomeProduto: group.first()['nomeProduto'],
        quantidade: group.first()['quantidade']
    }))
    .inflate();

let rankingVendasAno = pedidosComValor.groupBy(row => row['ano'])
    .select(group => ({
        ano: group.first()['ano'],
        valorVendas: parseFloat(group.deflate(row => row['valor']).sum().toFixed(2))
    }))
    .inflate();

let rankingVendasMesAno = pedidosComValor.orderBy(row => row['ano'])
    .thenBy(row => row['mes'])
    .groupSequentialBy(row => row['mes'])
    .select(group => ({
        ano: group.first()['ano'],
        mes: group.first()['mes'],
        valorVendas: parseFloat(group.deflate(row => row['valor']).sum().toFixed(2))
    }))
    .inflate();

let tabelaMediaProdutosVendidosPorVendedorPorAno = pedidosComValor.join(
    listaVendedores,
    (left) => left.idVendedor,
    (right) => right.id,
    (left, right) => {
        return {idVendedor: left.idVendedor, nomeVendedor: right.nome, idProduto: left.idProduto, quantidade: left.quantidade, valor: left.valor, mes: left.mes, ano: left.ano};
    })
    .orderBy(row => row['nomeVendedor'])
    .groupSequentialBy(row => row['ano'])
    .select(group => ({
        idVendedor: group.first()['idVendedor'],
        nomeVendedor: group.first()['nomeVendedor'],
        ano: group.first()['ano'],
        mediaVendas: group.deflate(row => row['quantidade']).average().toFixed(2)
    }))
    .inflate();

let tabelaMediaProdutosVendidosPorVendedorPorMes = pedidosComValor.join(
    listaVendedores,
    (left) => left.idVendedor,
    (right) => right.id,
    (left,right) => {
        return {idVendedor: left.idVendedor, nomeVendedor: right.nome, idProduto: left.idProduto, quantidade: left.quantidade, valor: left.valor, mes: left.mes, ano: left.ano};
    })
    .orderBy(row => row['nomeVendedor'])
    .groupSequentialBy(row => row['mes'])
    .select(group => ({
        idVendedor: group.first()['idVendedor'],
        nomeVendedor: group.first()['nomeVendedor'],
        mes: group.first()['mes'],
        ano: group.first()['ano'],
        mediaVendas: group.deflate(row => row['quantidade']).average().toFixed(2)
    }))
    .inflate();

let bottom5MediaVendedores = tabelaMediaProdutosVendidosPorVendedorPorAno.orderBy(row => row['mediaVendas']).head(5);

/* Imprime a lista de 5 valores, mas com valores separados

let rankingTop5ClientesPorPais = pedidosComValor.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left, right) => {
        return {idCliente: left.idCliente, nomeCliente: right.nome, idProduto: left.idProduto, quantidade: left.quantidade, pais: right.pais, valor: left.valor, mes: left.mes, ano: left.ano};
    })
    .orderBy(row => row['nomeCliente'])
    .groupSequentialBy(row => row['ano'])
    .select(group => ({
        ano: group.first()['ano'],
        pais: group.first()['pais'],
        idCliente: group.first()['idCliente'],
        nomeCliente: group.first()['nomeCliente'],
        valor: parseFloat(group.deflate(row => row['valor']).sum().toFixed(2))
    }))
    .inflate()
    .orderBy(row => row['pais'])
    .thenByDescending(row => row['valor'])
    .groupSequentialBy(row => row['pais'])
    .select(group => ({
        ano: group.deflate(row => row['ano']).take(5),
        pais: group.deflate(row => row['pais']).take(5),
        idCliente: group.deflate(row => row['idCliente']).take(5),
        nomeCliente: group.deflate(row => row['nomeCliente']).take(5),
        valor: group.deflate(row => row['valor']).take(5)
    }))
    .inflate();*/

/*Escreve os dataframes completos divididos por cada país, mas não sei como exportar somentes os cinco valores desses dataframes

*/let rankingTop5ClientesPorPais = pedidosComValor.join(
    listaClientes,
    (left) => left.idCliente,
    (right) => right.id,
    (left, right) => {
        return {idCliente: left.idCliente, nomeCliente: right.nome, idProduto: left.idProduto, quantidade: left.quantidade, pais: right.pais, valor: left.valor, mes: left.mes, ano: left.ano};
    })
    .orderBy(row => row['nomeCliente'])
    .groupSequentialBy(row => row['ano'])
    .select(group => ({
        ano: group.first()['ano'],
        pais: group.first()['pais'],
        idCliente: group.first()['idCliente'],
        nomeCliente: group.first()['nomeCliente'],
        valor: parseFloat(group.deflate(row => row['valor']).sum().toFixed(2))
    }))
    .inflate()
    .orderBy(row => row['pais'])
    .thenByDescending(row => row['valor'])
    .groupSequentialBy(row => row['pais']);

console.log(rankingTop5ClientesPorPais.head(2).toString());