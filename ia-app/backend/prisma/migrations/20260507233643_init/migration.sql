-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "chatbot";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "person";

-- CreateTable
CREATE TABLE "auth"."credential" (
    "credential_id" SERIAL NOT NULL,
    "credential_code" UUID NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "username" VARCHAR(250) NOT NULL,
    "credential_password" TEXT NOT NULL,
    "last_login" TIMESTAMP(6),
    "failed_login_attempts" INTEGER DEFAULT 0,
    "credential_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_credential" PRIMARY KEY ("credential_id")
);

-- CreateTable
CREATE TABLE "auth"."user_session" (
    "session_id" SERIAL NOT NULL,
    "credential_id" INTEGER NOT NULL,
    "access_token" TEXT NOT NULL,
    "session_code" UUID NOT NULL,
    "date_init" TIMESTAMP(6) NOT NULL,
    "date_end" TIMESTAMP(6) NOT NULL,
    "session_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_session" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "person"."profile" (
    "profile_id" SERIAL NOT NULL,
    "profile_code" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "first_lastname" VARCHAR(50) NOT NULL,
    "second_name" VARCHAR(50),
    "second_lastname" VARCHAR(50),
    "profile_email" VARCHAR(250) NOT NULL,
    "dni" VARCHAR(25) NOT NULL,
    "date_birth" DATE NOT NULL,
    "profile_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_profile" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "auth"."credential_role" (
    "credential_role_id" SERIAL NOT NULL,
    "credential_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_credential_role" PRIMARY KEY ("credential_role_id")
);

-- CreateTable
CREATE TABLE "auth"."role" (
    "role_id" SERIAL NOT NULL,
    "role_code" UUID NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "role_description" VARCHAR(250),
    "role_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_role" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "auth"."audit_log" (
    "audit_log_id" SERIAL NOT NULL,
    "credential_id" INTEGER NOT NULL,
    "session_id" INTEGER NOT NULL,
    "user_action" TEXT NOT NULL,
    "record_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_audit_log" PRIMARY KEY ("audit_log_id")
);

-- CreateTable
CREATE TABLE "chatbot"."chatbot_conversation" (
    "conversation_id" SERIAL NOT NULL,
    "conversation_code" UUID NOT NULL,
    "credential_id" INTEGER NOT NULL,
    "username" VARCHAR(250) NOT NULL,
    "title" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_chatbot_conversation" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "chatbot"."chatbot_message" (
    "message_id" SERIAL NOT NULL,
    "message_code" UUID NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_chatbot_message" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "chatbot"."chatbot_query_result" (
    "query_result_id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "sql_generated" TEXT NOT NULL,
    "result_data" JSONB,
    "chart_config" JSONB,
    "row_count" INTEGER,
    "execution_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_chatbot_query_result" PRIMARY KEY ("query_result_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credential_credential_code_key" ON "auth"."credential"("credential_code");

-- CreateIndex
CREATE UNIQUE INDEX "credential_profile_id_key" ON "auth"."credential"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "credential_username_key" ON "auth"."credential"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_access_token_key" ON "auth"."user_session"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_session_code_key" ON "auth"."user_session"("session_code");

-- CreateIndex
CREATE UNIQUE INDEX "profile_profile_code_key" ON "person"."profile"("profile_code");

-- CreateIndex
CREATE UNIQUE INDEX "profile_profile_email_key" ON "person"."profile"("profile_email");

-- CreateIndex
CREATE UNIQUE INDEX "profile_dni_key" ON "person"."profile"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "uq_credential_role" ON "auth"."credential_role"("credential_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_role_code_key" ON "auth"."role"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "role_role_name_key" ON "auth"."role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_conversation_conversation_code_key" ON "chatbot"."chatbot_conversation"("conversation_code");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_message_message_code_key" ON "chatbot"."chatbot_message"("message_code");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_query_result_message_id_key" ON "chatbot"."chatbot_query_result"("message_id");

-- AddForeignKey
ALTER TABLE "auth"."credential" ADD CONSTRAINT "fk_profile_credential" FOREIGN KEY ("profile_id") REFERENCES "person"."profile"("profile_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."user_session" ADD CONSTRAINT "fk_credential_session" FOREIGN KEY ("credential_id") REFERENCES "auth"."credential"("credential_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."credential_role" ADD CONSTRAINT "fk_credential_credentialrole" FOREIGN KEY ("credential_id") REFERENCES "auth"."credential"("credential_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."credential_role" ADD CONSTRAINT "fk_role_credentialrole" FOREIGN KEY ("role_id") REFERENCES "auth"."role"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."audit_log" ADD CONSTRAINT "fk_credential_auditlog" FOREIGN KEY ("credential_id") REFERENCES "auth"."credential"("credential_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."audit_log" ADD CONSTRAINT "fk_session_auditlog" FOREIGN KEY ("session_id") REFERENCES "auth"."user_session"("session_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chatbot"."chatbot_conversation" ADD CONSTRAINT "fk_credential_conversation" FOREIGN KEY ("credential_id") REFERENCES "auth"."credential"("credential_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chatbot"."chatbot_message" ADD CONSTRAINT "fk_conversation_message" FOREIGN KEY ("conversation_id") REFERENCES "chatbot"."chatbot_conversation"("conversation_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chatbot"."chatbot_query_result" ADD CONSTRAINT "fk_message_queryresult" FOREIGN KEY ("message_id") REFERENCES "chatbot"."chatbot_message"("message_id") ON DELETE CASCADE ON UPDATE NO ACTION;
