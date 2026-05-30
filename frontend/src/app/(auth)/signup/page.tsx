"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { useSignup } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api";
import { useT } from "@/lib/i18n";

const schema = z.object({
  name: z.string().min(1, "auth.error.nameRequired").max(120),
  email: z.string().email("auth.error.invalidEmail"),
  password: z.string().min(8, "auth.error.passwordMin"),
});
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const t = useT();
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    signup.mutate(values, {
      onError: (err) => {
        const msg =
          err instanceof ApiRequestError ? err.message : t("auth.error.generic");
        toast.error(msg);
      },
    });
  };

  return (
    <div className="rounded-lg border border-border bg-bg-subtle p-6">
      <h2 className="mb-1 text-base font-semibold text-fg">
        {t("auth.signup.title")}
      </h2>
      <p className="mb-5 text-sm text-fg-muted">{t("auth.signup.subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">{t("auth.field.name")}</Label>
          <Input
            id="name"
            placeholder={t("auth.placeholder.name")}
            className="mt-1"
            {...register("name")}
          />
          <FieldError message={errors.name?.message ? t(errors.name.message) : undefined} />
        </div>
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
            autoComplete="new-password"
            placeholder={t("auth.placeholder.newPassword")}
            className="mt-1"
            {...register("password")}
          />
          <FieldError
            message={errors.password?.message ? t(errors.password.message) : undefined}
          />
        </div>
        <Button type="submit" className="w-full" disabled={signup.isPending}>
          {signup.isPending && <Spinner />}
          {t("auth.signup.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-fg-muted">
        {t("auth.signup.haveAccount")}{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          {t("auth.signup.loginLink")}
        </Link>
      </p>
    </div>
  );
}
