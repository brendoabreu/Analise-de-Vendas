const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');
const listaClientes = DF.readFileSync('clients.csv').parseCSV();

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
        return {idCliente: left.idCliente, Nome: right.nome, NumPedidos: left.totalPedidos}
    }
);

//console.log(qtdePedidosPorCliente.head(5).toString());
//console.log(listaClientes.head(5).toString());