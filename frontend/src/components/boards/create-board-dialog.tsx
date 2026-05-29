"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { useCreateBoard } from "@/hooks/use-boards";
import { useT } from "@/lib/i18n";

const COLORS = [
  "#58A6FF",
  "#3FB950",
  "#D29922",
  "#F85149",
  "#BC8CFF",
  "#39C5CF",
];

const schema = z.object({
  name: z.string().min(1, "createBoard.nameRequired").max(120),
  description: z.string().max(2000).optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateBoardDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [color, setColor] = useState(COLORS[0]);
  const createBoard = useCreateBoard();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const close = () => {
    reset();
    setColor(COLORS[0]);
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    createBoard.mutate(
      { ...values, color },
      {
        onSuccess: () => {
          toast.success(t("createBoard.success"));
          close();
        },
        onError: () => toast.error(t("createBoard.error")),
      },
    );
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader title={t("createBoard.title")} onClose={close} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t("createBoard.name")}</Label>
              <Input
                id="name"
                placeholder={t("createBoard.namePlaceholder")}
                className="mt-1"
                autoFocus
                {...register("name")}
              />
              <FieldError message={errors.name?.message ? t(errors.name.message) : undefined} />
            </div>
            <div>
              <Label htmlFor="description">{t("createBoard.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("createBoard.descriptionPlaceholder")}
                className="mt-1"
                {...register("description")}
              />
            </div>
            <div>
              <Label>{t("createBoard.color")}</Label>
              <div className="mt-2 flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={cn(
                      "h-7 w-7 rounded-full transition-transform",
                      color === c
                        ? "ring-2 ring-fg ring-offset-2 ring-offset-bg-subtle scale-110"
                        : "hover:scale-110",
                    )}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={createBoard.isPending}>
            {createBoard.isPending && <Spinner />}
            {t("createBoard.submit")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
