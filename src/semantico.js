class ValidadorSemantico {
    constructor(retorno_parser) {
        this.programa = retorno_parser["programa"];
        this.simbolos = retorno_parser["simbolos"];
    }

    verificaNaoDeclarados() {
        // TODO: para cada atribuicao dentro do bloco principal, verificar se identificador esta na TS
        
    }

    verificaTipos() {
        // TODO: para cada atribuicao dentro do bloco principal, verificar se o tipo do indentificador é igual ao da expressao
        
    }
}

module.exports = ValidadorSemantico;