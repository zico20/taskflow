"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { useT } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email("auth.error.invalidEmail"),
});
type FormValues = z.infer<typeof schema>;

/**
 * Password reset request screen (presentation only).
 *
 * NOTE: there is no backend reset endpoint yet — this screen does not call the
 * API. It validates the email and shows the "check your inbox" confirmation so
 * the flow can be reviewed visually. Wire `onSubmit` to a real
 * `POST /auth/password/reset` endpoint when the backend adds one; the API
 * contract and types are intentionally left untouched.
 */
export default function ForgotPasswordPage() {
  const t = useT();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    // Placeholder: no API call. Simulate the request resolving.
    setPending(true);
    window.setTimeout(() => {
      setSentTo(values.email);
      setPending(false);
    }, 500);
  };

  if (sentTo) {
    return (
      <div className="glass-frost rounded-2xl p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
          <MailCheck size={22} />
        </div>
        <h2 className="text-base font-semibold text-fg">
          {t("auth.forgot.sent.title")}
        </h2>
        <p dir="auto" className="mt-1.5 text-sm text-fg-muted">
          {t("auth.forgot.sent.desc", { email: sentTo })}
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="mt-4 text-sm text-accent hover:text-accent-hover"
        >
          {t("auth.forgot.sentAgain")}
        </button>
        <p className="mt-5 text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg"
          >
            <ArrowLeft size={15} className="rtl:rotate-180" />
            {t("auth.forgot.back")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="glass-frost rounded-2xl p-6">
      <h2 className="mb-1 text-base font-semibold text-fg">
        {t("auth.forgot.title")}
      </h2>
      <p className="mb-5 text-sm text-fg-muted">{t("auth.forgot.subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("auth.field.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            placeholder={t("auth.placeholder.email")}
            className="mt-1"
            {...register("email")}
          />
          <FieldError
            message={errors.email?.message ? t(errors.email.message) : undefined}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Spinner />}
          {t("auth.forgot.submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("auth.forgot.back")}
        </Link>
      </p>
    </div>
  );
}
