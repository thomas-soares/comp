const fs = require("fs");


const palavras_reservadas = {
    "programa": "S#PROGRAMA",
    "inicio": "S#INICIO_BLOCO",
    "fim": "S#FIM_BLOCO",
    "escreva": "S#ESCREVA",
    "var": "S#VAR",
    "inteiro": "S#TIPO_INTEIRO",
    "booleano": "S#TIPO_BOOLEANO",
    "verdadeiro": "S#VERDADEIRO",
    "falso": "S#FALSO"
};

const op_aritmeticos = {
    "+": "S#SOMA",
    "-": "S#SUBTRACAO",
    "*": "S#MULTIPLICACAO",
    "/": "S#DIVISAO"
};

const op_relacionais = {
    "<": "S#MENOR_QUE",
    ">": "S#MAIOR_QUE"
};

const pontuacao = {
    "(": "S#ABRE_PARENTESES",
    ")": "S#FECHA_PARENTESES",
    ".": "S#FIM_PROGRAMA",
    ",": "S#VIRGULA",
    ";": "S#PONTOEVIRGULA"
};

const numeros = Array.from("0123456789");
const alfanum = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_");

class Token {
    constructor(tipo, lexema, linha, coluna) {
        this.tipo = tipo;
        this.lexema = lexema;
        this.linha = linha;
        this.coluna = coluna;
    }
}


class Simbolo {
    constructor(tipo, lexema, linha, coluna) {
        this.tipo = tipo;
        this.lexema = lexema;
        this.linha = linha;
        this.coluna = coluna;
        this.escopo = null;
        this.tipodado = null;
    }
}


class TabelaSimbolos {
    constructor() {
        this.simbolos = {};
    }

    inserirSimbolo(simbolo) {
        if(!Object.keys(this.simbolos).includes(simbolo.lexema))
        {
            this.simbolos[simbolo.lexema] = simbolo;
        }
        else {
            // Erro semantico
            //throw Error(`Simbolo ${simbolo.lexema} declarado várias vezes!`);
        }
    }

    atualizarTipoSimbolo(nome, tipo) {
        if(Object.keys(this.simbolos).includes(nome))
        {
            this.simbolos[nome].tipodado = tipo;
        }
    }

    atualizarEscopoSimbolo(nome, escopo) {
        if(Object.keys(this.simbolos).includes(nome))
        {
            this.simbolos[nome].escopo = escopo;
        }
    }

    lerSimbolo(nome) {
        Object.keys(this.simbolos).forEach((simbolo) => {
            if(simbolo.lexema == nome)
            {
                return simbolo;
            }
        });
        return null;
    }

    lerTabela() {
        return Object.values(this.simbolos);
    }
}

// Analisador lexico
class Scanner {
    constructor() {
        this.linha = 1;
        this.coluna = 1;
        this.tokens = [];
        this.simbolos = new TabelaSimbolos();
        this.ult_col = null;
        this.posicao = 0;
        this.simbolo = null;
        this.estado = 0;
        this.texto = "";
        this.comentario = false;
    }

    lerCaracter(indice) {
        if(indice < this.texto.length) {
            return this.texto[indice];
        } else {
            return null;
        }
    }

    lerArquivo(caminho) {
        if(typeof(caminho) != "string") {
            throw Error("O caminho deve ser uma string!")
        }

        if(caminho.split('.').pop() != "lpd") {
            throw Error("O arquivo não é um LPD válido!")
        }

        this.texto = fs.readFileSync(caminho, "utf8", (err, conteudo) => {
            if (err) throw err;
            return conteudo;
        });

        while(true) {
            switch(this.estado) {
                case 0:
                    this.simbolo = this.lerCaracter(this.posicao);
                    if(this.simbolo) {
                        if((this.simbolo == " ") || (this.simbolo == "\t") || (this.simbolo == "\r")) {
                            this.estado = 1;
                        }
                        else if(this.simbolo == "\n") {
                            this.estado = 2;
                        }
                        else if(this.simbolo == "{") {
                            this.estado = 3;
                        }
                        else if(Object.keys(op_aritmeticos).includes(this.simbolo)
                            || Object.keys(op_relacionais).includes(this.simbolo)
                            || Object.keys(pontuacao).includes(this.simbolo)) {
                                this.estado = 4;
                        }
                        else if(this.simbolo == ":") {
                            this.estado = 5;
                        }
                        else if(numeros.includes(this.simbolo)) {
                            this.estado = 6;
                        }
                        else if(alfanum.includes(this.simbolo)) {
                            this.estado = 7;
                        }
                        else {
                            throw Error("Símbolo inválido " + this.simbolo + " na linha " + this.linha + " coluna " + this.coluna);
                        }
                        this.posicao++;
                    }
                    else {
                        return {"tokens": this.tokens, "simbolos": this.simbolos};
                    }
                    break;

                case 1:
                    this.coluna++;
                    this.estado = 0;
                    break;

                case 2:
                    this.linha++;
                    this.coluna = 1;
                    this.estado = 0;
                    break;

                case 3:
                    this.comentario = true;
                    var i = this.posicao;
                    while(this.simbolo != "}") {
                        this.simbolo = this.lerCaracter(i);
                        this.coluna++;
                        if(this.simbolo == "\n") {
                            this.linha++;
                            this.coluna = 1;
                        }
                        i++;
                    }
                    this.posicao = i;
                    this.estado = 0;
                    break;

                case 4:
                    if(Object.keys(op_aritmeticos).includes(this.simbolo)) {
                        var tipotoken = op_aritmeticos[this.simbolo];
                        this.tokens.push(new Token(tipotoken, this.simbolo, this.linha, this.coluna));
                    }
                    else if(Object.keys(op_relacionais).includes(this.simbolo)) {
                        var tipotoken = op_relacionais[this.simbolo];
                        this.tokens.push(new Token(tipotoken, this.simbolo, this.linha, this.coluna));
                    }
                    else if(Object.keys(pontuacao).includes(this.simbolo)) {
                        var tipotoken = pontuacao[this.simbolo];
                        this.tokens.push(new Token(tipotoken, this.simbolo, this.linha, this.coluna));
                    }
                    this.coluna++;
                    this.estado = 0;
                    break;

                case 5:
                    this.simbolo = this.lerCaracter(this.posicao);
                    if(this.simbolo == "=") {
                        this.estado = 8;
                    }
                    else {
                        this.simbolo = this.lerCaracter(this.posicao-1);
                        this.estado = 9;
                    }
                    break;

                case 6:
                    var numero = this.simbolo;
                    var i = this.posicao;
                    this.simbolo = this.lerCaracter(this.posicao);
                    while(numeros.includes(this.simbolo)) {
                        numero = numero + this.simbolo;
                        i++;
                        this.simbolo = this.lerCaracter(i);
                    }
                    this.posicao = i;
                    this.tokens.push(new Token("S#VALOR_INTEIRO", numero, this.linha, this.coluna));
                    this.coluna += numero.length;
                    this.estado = 0;
                    break;

                case 7:
                    var palavra = this.simbolo;
                    var i = this.posicao;
                    this.simbolo = this.lerCaracter(this.posicao);
                    while(alfanum.includes(this.simbolo)) {
                        palavra += this.simbolo;
                        i++;
                        this.simbolo = this.lerCaracter(i);
                    }
                    this.posicao = i;
                    if(Object.keys(palavras_reservadas).includes(palavra)) {
                        tipotoken = palavras_reservadas[palavra];
                        this.tokens.push(new Token(tipotoken, palavra, this.linha, this.coluna));
                    }
                    else {
                        this.tokens.push(new Token("S#IDENTIFICADOR", palavra, this.linha, this.coluna));
                        // TODO: mover para sintatico?
                        this.simbolos.inserirSimbolo(new Simbolo("S#IDENTIFICADOR", palavra, this.linha, this.coluna, "programa"));
                    }
                    this.coluna += palavra.length;
                    this.estado = 0;
                    break;

                case 8:
                    var lexema = this.simbolo + this.lerCaracter(this.posicao);
                    var tipotoken = "S#ATRIBUICAO";
                    this.tokens.push(new Token(tipotoken, lexema, this.linha, this.coluna));
                    this.coluna += 2;
                    this.posicao++;
                    this.estado = 0;
                    break;

                case 9:
                    tipotoken = "S#DEF_TIPO";
                    this.tokens.push(new Token(tipotoken, this.simbolo, this.linha, this.coluna));
                    this.coluna++;
                    this.estado = 0;
                    break;
            }
        }
    }
}

module.exports = Scanner;