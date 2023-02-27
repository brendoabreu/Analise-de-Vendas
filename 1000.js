const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');

let pedidosClientes = listaPedidos
    .groupBy(row => row['cliente'])
    .select(group => ({
        idCliente: group.first()['cliente'],
        totalPedidos: group.deflate(row => row['quantidade']).sum(),
}))
.inflate();

console.log(pedidosClientes.head(1000).toString());