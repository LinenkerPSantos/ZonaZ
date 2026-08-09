from flask_login import UserMixin


class Usuario(UserMixin):
    def __init__(self, row):
        self.id = row['id']
        self.nome_usuario = row['nome_usuario']
        self.email = row['email']
        self.senha_hash = row['senha_hash']
        self.papel = row['papel']
        self.nome_exibicao = row['nome_exibicao']

    def get_id(self):
        return str(self.id)

    def to_dict(self):
        return {
            'id': self.id,
            'nome_usuario': self.nome_usuario,
            'email': self.email,
            'papel': self.papel,
            'nome_exibicao': self.nome_exibicao,
        }
