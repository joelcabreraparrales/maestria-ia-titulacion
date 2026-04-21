DROP DATABASE IF EXISTS chatbot_bi;
CREATE DATABASE chatbot_bi;

CREATE SCHEMA auth;
CREATE SCHEMA person;

CREATE TABLE person.profile(
	profile_id SERIAL NOT NULL,
	profile_code UUID UNIQUE NOT NULL,
	first_name VARCHAR(50) NOT NULL,
	first_lastname VARCHAR(50) NOT NULL,
	second_name VARCHAR(50) DEFAULT NULL,
	second_lastname VARCHAR(50) DEFAULT NULL,
	profile_email VARCHAR(250) UNIQUE NOT NULL,
	dni VARCHAR(25) UNIQUE NOT NULL,
	date_birth DATE NOT NULL CHECK (date_birth <= CURRENT_DATE),
	profile_active BOOLEAN DEFAULT TRUE NOT NULL,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL,
	updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
ALTER TABLE person.profile ADD CONSTRAINT Pk_Profile PRIMARY KEY (profile_id);
-- TRIGGER PARA ACTUALIZAR EL CAMPO updated_at cuando se actualizado el registro
CREATE OR REPLACE FUNCTION set_update_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_set_update_at
BEFORE UPDATE on person.profile
FOR EACH ROW EXECUTE FUNCTION set_update_at();


-- Modulo de autorización
CREATE TABLE auth.credential(
	credential_id SERIAL NOT NULL,
	credential_code UUID UNIQUE NOT NULL,
	profile_id INTEGER NOT NULL UNIQUE,
	username VARCHAR(250) NOT NULL UNIQUE,
	credential_password TEXT NOT NULL,
	last_login TIMESTAMP DEFAULT NULL CHECK (last_login <= CURRENT_TIMESTAMP),
	failed_login_attempts INTEGER DEFAULT 0 CHECK (failed_login_attempts >= 0),
	credential_locked BOOLEAN DEFAULT FALSE NOT NULL,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL,
	updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE auth.credential ADD CONSTRAINT Pk_Credential PRIMARY KEY(credential_id);
ALTER TABLE auth.credential ADD CONSTRAINT Fk_Profile_Credential FOREIGN KEY(profile_id) REFERENCES person.profile(profile_id);

-- TRIGGER DE ACTUALIZACIÓN DE updated_at CUANDO EL REGISTRO SE ACTUALICE
CREATE TRIGGER auth.trg_set_updated_at_in_credential
BEFORE UPDATE ON auth.credential
FOR EACH ROW EXECUTE FUNCTION set_update_at();

CREATE TABLE auth.user_session(
	session_id SERIAL NOT NULL,
	credential_id INTEGER NOT NULL,
	access_token TEXT NOT NULL UNIQUE,
	session_code UUID UNIQUE NOT NULL,
	date_init TIMESTAMP NOT NULL CHECK (date_init <= CURRENT_TIMESTAMP),
	date_end TIMESTAMP NOT NULL CHECK (date_end >= date_init),
	session_active BOOLEAN DEFAULT TRUE NOT NULL,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL,
	updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE auth.user_session ADD CONSTRAINT PK_Session PRIMARY KEY(session_id);
ALTER TABLE auth.user_session ADD CONSTRAINT Fk_Credential_Session FOREIGN KEY (credential_id) REFERENCES auth.credential(credential_id);

CREATE TRIGGER auth.trg_set_updated_at_in_session
BEFORE UPDATE ON auth.user_session
FOR EACH ROW EXECUTE FUNCTION set_update_at();



-- PERFIL DE ADMINISTRADOR
                                                                                                                                                                                                   
-- 1. Insertar perfil en person.profile
INSERT INTO person.profile (                                                                                                                                                                       
    profile_code,                                                                                                                                                                                        first_name,                                                                                                                                                                                    
    first_lastname,                                                                                                                                                                                
    second_name,                                                                                                                                                                                 
    second_lastname,                                                                                                                                                                                     profile_email,                                                                                                                                                                                       dni,                                                                                                                                                                                                 date_birth,                                                                                                                                                                                    
    profile_active
) VALUES (
    gen_random_uuid(),
    'Joel',
    'Cabrera',
    NULL,
    'Parrales',
    'joel.cabrera.parrales@gmail.com',
    '0953317880',       
    '1999-10-18',         
    TRUE
);

-- Auditoría de accesos
CREATE TABLE auth.audit_log(
	audit_log_id SERIAL NOT NULL,
	credential_id INTEGER NOT NULL,
	session_id INTEGER NOT NULL,
	user_action TEXT NOT NULL,
	record_active BOOLEAN DEFAULT TRUE NOT NULL,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL,
	updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE auth.audit_log ADD CONSTRAINT Pk_Audit_Log PRIMARY KEY(audit_log_id);
ALTER TABLE auth.audit_log ADD CONSTRAINT Fk_Credential_AuditLog FOREIGN KEY(credential_id) REFERENCES auth.credential(credential_id);
ALTER TABLE auth.audit_log ADD CONSTRAINT Fk_Session_AuditLog FOREIGN KEY(session_id) REFERENCES auth.user_session(session_id);

CREATE TRIGGER trg_set_updated_at_in_audit_log
BEFORE UPDATE ON auth.audit_log
FOR EACH ROW EXECUTE FUNCTION set_update_at();

-- Módulo de roles
CREATE TABLE auth.role(
	role_id SERIAL NOT NULL,
	role_code UUID UNIQUE NOT NULL,
	role_name VARCHAR(50) NOT NULL UNIQUE,
	role_description VARCHAR(250) DEFAULT NULL,
	role_active BOOLEAN DEFAULT TRUE NOT NULL,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL,
	updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE auth.role ADD CONSTRAINT Pk_Role PRIMARY KEY(role_id);

CREATE TRIGGER trg_set_updated_at_in_role
BEFORE UPDATE ON auth.role
FOR EACH ROW EXECUTE FUNCTION set_update_at();

CREATE TABLE auth.credential_role(
	credential_role_id SERIAL NOT NULL,
	credential_id INTEGER NOT NULL,
	role_id INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL,
	updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE auth.credential_role ADD CONSTRAINT Pk_Credential_Role PRIMARY KEY(credential_role_id);
ALTER TABLE auth.credential_role ADD CONSTRAINT Fk_Credential_CredentialRole FOREIGN KEY(credential_id) REFERENCES auth.credential(credential_id);
ALTER TABLE auth.credential_role ADD CONSTRAINT Fk_Role_CredentialRole FOREIGN KEY(role_id) REFERENCES auth.role(role_id);
ALTER TABLE auth.credential_role ADD CONSTRAINT Uq_Credential_Role UNIQUE(credential_id, role_id);

CREATE TRIGGER trg_set_updated_at_in_credential_role
BEFORE UPDATE ON auth.credential_role
FOR EACH ROW EXECUTE FUNCTION set_update_at();

-- Roles base del sistema
INSERT INTO auth.role (role_code, role_name, role_description) VALUES
	(gen_random_uuid(), 'ADMIN', 'Administrador del sistema con acceso total'),
	(gen_random_uuid(), 'USER', 'Usuario estándar con acceso básico');

-- 2. Insertar credencial en auth.credential (referenciando el profile recién creado)
INSERT INTO auth.credential (
    credential_code,
    profile_id,
    username,
    credential_password,
    credential_locked
) VALUES (
    gen_random_uuid(),
    (SELECT profile_id FROM person.profile WHERE profile_email = 'joel.cabrera.parrales@gmail.com'),
    'joel.cabrera.parrales@gmail.com',
    '$2b$10$U3pR9YxmM78TLUntdY8Ri.E/06Dz6kkcZ5hO2pouNC3HGcs5/rP4.',           -- texto plano: Doctor789
    FALSE
);

-- 3. Asignar rol ADMIN al perfil administrador
INSERT INTO auth.credential_role (credential_id, role_id)
VALUES (
    (SELECT credential_id FROM auth.credential WHERE username = 'joel.cabrera.parrales@gmail.com'),
    (SELECT role_id FROM auth.role WHERE role_name = 'ADMIN')
);

-- =============================================================
-- Módulo ChatBot BI
-- =============================================================
CREATE SCHEMA chatbot;

CREATE TABLE chatbot.chatbot_conversation (
	conversation_id   SERIAL NOT NULL,
	conversation_code UUID UNIQUE NOT NULL,
	credential_id     INTEGER NOT NULL,
	username          VARCHAR(250) NOT NULL,
	title             VARCHAR(255) DEFAULT NULL,
	is_active         BOOLEAN DEFAULT TRUE NOT NULL,
	created_at        TIMESTAMP DEFAULT NOW() NOT NULL,
	updated_at        TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE chatbot.chatbot_conversation ADD CONSTRAINT Pk_Chatbot_Conversation PRIMARY KEY (conversation_id);
ALTER TABLE chatbot.chatbot_conversation ADD CONSTRAINT Fk_Credential_Conversation FOREIGN KEY (credential_id) REFERENCES auth.credential (credential_id);

CREATE TRIGGER trg_set_updated_at_in_chatbot_conversation
BEFORE UPDATE ON chatbot.chatbot_conversation
FOR EACH ROW EXECUTE FUNCTION set_update_at();

CREATE TABLE chatbot.chatbot_message (
	message_id      SERIAL NOT NULL,
	message_code    UUID UNIQUE NOT NULL,
	conversation_id INTEGER NOT NULL,
	role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
	content         TEXT NOT NULL,
	created_at      TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE chatbot.chatbot_message ADD CONSTRAINT Pk_Chatbot_Message PRIMARY KEY (message_id);
ALTER TABLE chatbot.chatbot_message ADD CONSTRAINT Fk_Conversation_Message FOREIGN KEY (conversation_id) REFERENCES chatbot.chatbot_conversation (conversation_id) ON DELETE CASCADE;

CREATE TABLE chatbot.chatbot_query_result (
	query_result_id SERIAL NOT NULL,
	message_id      INTEGER NOT NULL UNIQUE,
	sql_generated   TEXT NOT NULL,
	result_data     JSONB DEFAULT NULL,
	chart_config    JSONB DEFAULT NULL,
	row_count       INTEGER DEFAULT NULL,
	execution_ms    INTEGER DEFAULT NULL,
	error_message   TEXT DEFAULT NULL,
	created_at      TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE chatbot.chatbot_query_result ADD CONSTRAINT Pk_Chatbot_Query_Result PRIMARY KEY (query_result_id);
ALTER TABLE chatbot.chatbot_query_result ADD CONSTRAINT Fk_Message_QueryResult FOREIGN KEY (message_id) REFERENCES chatbot.chatbot_message (message_id) ON DELETE CASCADE;