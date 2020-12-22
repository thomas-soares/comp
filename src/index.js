const Scanner = require("./lexico");
const Parser = require("./sintatico");
const Validador = require("./semantico");
const Gerador = require("./gerador");



// ================================
// Roda analisador lexico

var scanner = new Scanner();
var retorno_scanner = scanner.lerArquivo("teste.lpd");

// Mostra lista de tokens
//console.log("LISTA DE TOKENS:");
//retorno_scanner["tokens"].forEach(token => {
//    console.log("Token '" + token.tipo + "' com lexema '" + token.lexema + "' na linha " + token.linha + " coluna " + token.coluna);
//});

// Mostra tabela de simbolos
//console.log("TABELA DE SIMBOLOS:");
//retorno_scanner["simbolos"].lerTabela().forEach(simbolo => {
//    console.log("Simbolo '" + simbolo.tipo + "' com lexema '" + simbolo.lexema + "' e escopo '" + simbolo.escopo + "'");
//});


// ================================
// Roda analisador sintatico

var parser = new Parser(retorno_scanner);
var retorno_parser = parser.analisar();

// Mostra nós da arvore de derivação
console.log("ARVORE DE DERIVACAO:");
console.log(retorno_parser["programa"]);

// Mostra tabela de simbolos atualizada
console.log("TABELA DE SIMBOLOS ATUALIZADA:");
console.log(retorno_parser["simbolos"]);


// ================================
// Roda analisador semantico

// TODO: fazer
var validador = new Validador(retorno_parser);
//validador.verificaNaoDeclarados();
//validador.verificaTipos();


// ================================
// Roda gerador de codigo

// TODO: fazer
var gerador = new Gerador(retorno_parser);