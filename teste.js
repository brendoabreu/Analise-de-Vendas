const { group } = require('console');
const { DataFrame } = require('data-forge');
const DF = require('data-forge-fs');
const converter = require('json-2-csv');

const listaPedidos = DF.readFileSync('orders.csv').parseCSV().parseInts('quantidade');
const listaClientes = DF.readFileSync('clients.csv').parseCSV();
const listaVendedores = DF.readFileSync('sellers.csv').parseCSV();
const listaProdutos = DF.readFileSync('products.csv').parseCSV().parseFloats('preco');
const listaMaisVendidos = DF.readFileSync('3.1 e 3.2 ranking-vendas-produtos-valor.csv').parseCSV();

let JSON = [    
    {
        pais: 'Virgin Islands, U.S.',
        nomeProduto: 'Handmade Granite Cheese',
        quantidade: 2035
    },
    {
        pais: 'Wallis and Futuna',
        nomeProduto: 'Handcrafted Wooden Fish',
        quantidade: 2246
    }
];

let json2csvCallback = function (err, csv) {
    if (err) console.log('Erro ao converter');
    let resultado = csv;
    return resultado;
};

let oi = converter.json2csv(JSON, json2csvCallback);

console.log(oi);