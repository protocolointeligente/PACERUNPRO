"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/useAppStore";
import { SEXO_OPCOES } from "@/lib/data/options";
import type { Sexo } from "@/lib/types";

interface FormErrors {
  nome?: string;
  email?: string;
  dataNascimento?: string;
  sexo?: string;
  altura?: string;
  peso?: string;
  senha?: string;
}

export default function CadastroPage() {
  const router = useRouter();
  const iniciarCadastro = useAppStore((s) => s.iniciarCadastro);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<Sexo | "">("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const novosErros: FormErrors = {};
    if (!nome.trim()) novosErros.nome = "Informe seu nome";
    if (!email.trim()) novosErros.email = "Informe seu e-mail";
    if (!dataNascimento) novosErros.dataNascimento = "Informe sua data de nascimento";
    if (!sexo) novosErros.sexo = "Selecione uma opção";
    if (!altura || Number(altura) <= 0) novosErros.altura = "Informe sua altura";
    if (!peso || Number(peso) <= 0) novosErros.peso = "Informe seu peso";
    if (!senha) novosErros.senha = "Crie uma senha";

    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }

    iniciarCadastro({
      nome: nome.trim(),
      email: email.trim(),
      dataNascimento,
      sexo: sexo as Sexo,
      alturaCm: Number(altura),
      pesoKg: Number(peso),
    });

    router.push("/onboarding/objetivo");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBar title="Criar conta" showBack />

      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-10 pt-6 safe-bottom">
        <p className="text-text-muted">
          Preencha seus dados para começar sua jornada com o MV GYM.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label="Data de nascimento"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            error={errors.dataNascimento}
          />
          <div className="flex flex-col gap-1.5">
            <Select
              label="Sexo"
              value={sexo}
              onChange={(e) => setSexo(e.target.value as Sexo)}
              className={errors.sexo ? "border-danger" : undefined}
            >
              <option value="">Selecione</option>
              {SEXO_OPCOES.map((opcao) => (
                <option key={opcao.id} value={opcao.id}>
                  {opcao.label}
                </option>
              ))}
            </Select>
            {errors.sexo && <span className="text-xs text-danger">{errors.sexo}</span>}
          </div>
          <Input
            label="Altura (cm)"
            type="number"
            placeholder="170"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            error={errors.altura}
          />
          <Input
            label="Peso (kg)"
            type="number"
            placeholder="70"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            error={errors.peso}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={errors.senha}
          />

          <Button type="submit" size="lg" className="mt-2 w-full">
            Criar conta e continuar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
