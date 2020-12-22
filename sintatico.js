// Nodes da arvore em json
class Node {
    toJson() {
        return JSON.stringify(this, null, 4);
    }
}

class Programa extends Node {
    constructor(nome) {
        super();
        this.tipo = "programa";
        this.nome = nome;
        this.declaracoes = [];
        this.corpo = new Bloco();
    }

    inserirDeclaracao(declaracao) {
        if(!(declaracao instanceof Declaracao)) {
            throw Error("Só pode inserir declarações na lista de declarações!")
        }
        this.declaracoes.push(declaracao);
    }
  
    inserirComando(comando) {
        this.corpo.inserir(comando);
    }
}

class Bloco extends Node {
    constructor() {
        super();
        this.tipo = "bloco";
        this.conteudo = []
    }
  
    inserir(comando) {
        if(!comando instanceof Atribuicao || !comando instanceof ChamadaProcedimento) {
            throw Error("Só pode inserir comandos no bloco de comandos!")
        }
        this.conteudo.push(comando);
    }
}

class Valor extends Node {
    constructor(valor, tipodado) {
        super();
        this.tipo = "valor literal";
        this.valor = valor;
        this.tipodado = tipodado;
    }
}

class Identificador extends Node {
    constructor(nome) {
        super();
        this.tipo = "identificador";
        this.nome = nome;
    }
}

class Declaracao extends Node {
    constructor(nomeIdentificador, tipoIdentificador) {
        super();
        this.tipo = "declaracao";
        this.nomeIdentificador = nomeIdentificador;
        this.tipoIdentificador = tipoIdentificador;
    }
}

class OpBinaria extends Node {
    constructor(operador, esquerda, direita) {
        super();
        this.tipo = "operacao binaria";
        this.operador = operador;
        this.esquerda = esquerda;
        this.direita = direita;
    }
}

class Atribuicao extends Node {
    constructor(nomeIdentificador, valor) {
        super();
        this.tipo = "atribuicao";
        this.nomeIdentificador = nomeIdentificador;
        this.valor = valor;
    }
}

class ChamadaProcedimento extends Node {
    constructor(nomeIdentificador, argumentos) {
        super();
        this.tipo = "chamada de procedimento";
        this.nomeIdentificador = nomeIdentificador;
        this.argumentos = argumentos;
    }
}

// Analisador sintatico
class Parser {
    constructor(retorno_scanner) {
        this.tokens = retorno_scanner["tokens"];
        this.posicao_tokens = 0;
        this.simbolos = retorno_scanner["simbolos"];
        this.programa = null;
        this.token_atual = null;
        this.atribuindo = false;
    }

    proximoToken() {
        this.token_atual = this.tokens[this.posicao_tokens];
        this.posicao_tokens++;
    }

    verificaToken(tipotoken) {
        if(this.token_atual.tipo == tipotoken) {
            this.proximoToken();
        }
        else {
            throw Error(`Era esperado ${tipotoken} e recebeu ${this.token_atual.tipo}`);
        }
    }

    analisar() {
        this.proximoToken();
        this.validarPrograma()
        return {"programa": this.programa.toJson(), "simbolos": this.simbolos};
    }

    validarPrograma() {
        // programa <identificador> ; <validaVariaveis> <validaBloco> .
        this.verificaToken("S#PROGRAMA");
        this.programa = new Programa(this.token_atual.lexema);
        this.simbolos.atualizarTipoSimbolo(this.token_atual.lexema, "id_programa");
        this.verificaToken("S#IDENTIFICADOR");
        this.verificaToken("S#PONTOEVIRGULA");
        this.validaVariaveis();
        this.validaBloco();
        this.verificaToken("S#FIM_PROGRAMA");
    }

    validaVariaveis() {
        // var <identificador> [, <identificador>] : inteiro | booleano ; [<validaVariaveis>]
        if(this.token_atual.tipo == "S#VAR") {
            this.verificaToken("S#VAR");
            var nomes = [];
            while(1) {
                if(this.token_atual.tipo == "S#IDENTIFICADOR") {
                    nomes.push(this.token_atual.lexema);
                    this.verificaToken("S#IDENTIFICADOR");
                }
                if(this.token_atual.tipo == "S#VIRGULA") {
                    this.verificaToken("S#VIRGULA");
                }
                else {
                    break;
                }
            }
            this.verificaToken("S#DEF_TIPO");
            var tipo;
            switch(this.token_atual.tipo) {
                case "S#TIPO_INTEIRO":
                    tipo = "inteiro";
                    this.verificaToken("S#TIPO_INTEIRO");
                    break;
                case "S#TIPO_BOOLEANO":
                    tipo = "booleano";
                    this.verificaToken("S#TIPO_BOOLEANO");
                    break;
                default:
                    throw Error("Esperado um tipo.");
            }
            this.verificaToken("S#PONTOEVIRGULA");
            nomes.forEach((nome) => {
                this.simbolos.atualizarTipoSimbolo(nome, tipo);
                this.programa.inserirDeclaracao(new Declaracao(nome, tipo));
            })
            this.validaVariaveis();
        }
        else {
            return;
        }
    }

    validaBloco() {
        // inicio <validaComandos> fim
        if(this.token_atual.tipo == "S#INICIO_BLOCO") {
            this.verificaToken("S#INICIO_BLOCO");
            while(this.token_atual.tipo != "S#FIM_BLOCO") {
                this.validaComandos();
            }
            this.verificaToken("S#FIM_BLOCO");
        }
    }

    validaComandos() {
        // <validaEscreva> | <validaAtribuicao> ; [<validaComandos>]
        while(this.token_atual.tipo != "S#FIM_BLOCO") {
            switch(this.token_atual.tipo) {
                case "S#ESCREVA":
                    this.validaEscreva();
                    this.verificaToken("S#PONTOEVIRGULA");
                    break;
                case "S#IDENTIFICADOR":
                    this.validaAtribuicao();
                    this.verificaToken("S#PONTOEVIRGULA");
                    break;
                default:
                    throw Error("Esperado um comando.");
            }
        }
    }

    validaAtribuicao() {
        // <identificador> := <validaExpressao>
        var nome = this.token_atual.lexema;
        this.verificaToken("S#IDENTIFICADOR");
        this.verificaToken("S#ATRIBUICAO");
        var valor = this.validaExpressao();
        this.programa.inserirComando(new Atribuicao(nome, valor));
    }

    validaEscreva() {
        // escreva ( <validaExpressao> )
        this.verificaToken("S#ESCREVA");
        this.verificaToken("S#ABRE_PARENTESES");
        var valor = this.validaExpressao();
        this.verificaToken("S#FECHA_PARENTESES");
        this.programa.inserirComando(new ChamadaProcedimento("escreva", valor));
    }

    validaExpressao() {
        // <validaTermo> | <validaTermo> + <validaTermo> | <validaTermo> - <validaTermo>
        var esquerda = this.validaTermo();
        var operacao;
        var direita;
        if(this.token_atual.tipo == "S#SOMA") {
            this.verificaToken("S#SOMA");
            operacao = "+";
            direita = this.validaTermo();
        }
        if(this.token_atual.tipo == "S#SUBTRACAO") {
            this.verificaToken("S#SUBTRACAO");
            operacao = "-";
            direita = this.validaTermo();
        }
        return this.retornaNodeExpressao(esquerda, operacao, direita);
    }
    
    validaTermo() {
        // <validaFator> | <validaFator> * <validaFator> | <validaFator> / <validaFator>
        var esquerda = this.validaFator();
        var operacao;
        var direita;
        if(this.token_atual.tipo == "S#MULTIPLICACAO") {
            this.verificaToken("S#MULTIPLICACAO");
            operacao = "*";
            direita = this.validaFator();
        }
        if(this.token_atual.tipo == "S#DIVISAO") {
            this.verificaToken("S#DIVISAO");
            operacao = "/";
            direita = this.validaFator();
        }
        return this.retornaNodeExpressao(esquerda, operacao, direita);
    }

    validaFator() {
        // <identificador> | <valor>
        var valor = this.token_atual.lexema;
        var tipodado;
        switch(this.token_atual.tipo) {
            case "S#IDENTIFICADOR":
                this.verificaToken("S#IDENTIFICADOR");
                break
            case "S#VALOR_INTEIRO":
                tipodado = "inteiro";
                this.verificaToken("S#VALOR_INTEIRO");
                break;
            case "S#VERDADEIRO":
                tipodado = "booleano";
                this.verificaToken("S#VERDADEIRO");
                break;
            case "S#FALSO":
                tipodado = "booleano";
                this.verificaToken("S#FALSO");
                break;
            default:
                throw Error("Esperado um identificador ou valor.");
        }
        if(tipodado) {
            return new Valor(valor, tipodado);
        }
        else {
            return new Identificador(valor);
        }
    }

    retornaNodeExpressao(esquerda, operacao, direita) {
        if(operacao) {
            return new OpBinaria(operacao, esquerda, direita);
        }
        else {
            return esquerda;
        }
    }
}

module.exports = Parser;