const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');
const listaClientes = DF.readFileSync('clients.csv').parseCSV();
const listaVendedores = DF.readFileSync('sellers.csv').parseCSV();
const listaProdutos = DF.readFileSync('products.csv').parseCSV().parseFloats('preco');
const listaMaisVendidos = DF.readFileSync('3.1 e 3.2 ranking-vendas-produtos-valor.csv').parseCSV();

let teste = listaPedidos.where(row => row['cliente'] === '472');

console.log(teste.head(5).toString());