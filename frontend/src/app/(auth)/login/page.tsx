"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api";
import { useT } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email("auth.error.invalidEmail"),
  password: z.string().min(1, "auth.error.passwordRequired"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const t = useT();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    login.mutate(values, {
      onError: (err) => {
        const msg =
          err instanceof ApiRequestError ? err.message : t("auth.error.generic");
        toast.error(msg);
      },
    });
  };

  return (
    <div className="glass-frost rounded-2xl p-6">
      <h2 className="mb-1 text-base font-semibold text-fg">
        {t("auth.login.title")}
      </h2>
      <p className="mb-5 text-sm text-fg-muted">{t("auth.login.subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("auth.field.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.placeholder.email")}
            className="mt-1"
            {...register("email")}
          />
          <FieldError message={errors.email?.message ? t(errors.email.message) : undefined} />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.field.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder={t("auth.placeholder.password")}
            className="mt-1"
            {...register("password")}
          />
          <FieldError
            message={errors.password?.message ? t(errors.password.message) : undefined}
          />
        </div>
        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-xs text-accent hover:text-accent-hover"
          >
            {t("auth.login.forgot")}
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={login.isPending}>
          {t("auth.login.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-fg-muted">
        {t("auth.login.noAccount")}{" "}
        <Link href="/signup" className="text-accent hover:text-accent-hover">
          {t("auth.login.signupLink")}
        </Link>
      </p>
    </div>
  );
}
