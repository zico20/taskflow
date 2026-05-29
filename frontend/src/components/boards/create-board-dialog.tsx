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

const COLORS = [
  "#58A6FF",
  "#3FB950",
  "#D29922",
  "#F85149",
  "#BC8CFF",
  "#39C5CF",
];

const schema = z.object({
  name: z.string().min(1, "Board name is required").max(120),
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
          toast.success("Board created");
          close();
        },
        onError: () => toast.error("Couldn't create the board"),
      },
    );
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogHeader title="Create board" onClose={close} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Product Roadmap"
                className="mt-1"
                autoFocus
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this board for?"
                className="mt-1"
                {...register("description")}
              />
            </div>
            <div>
              <Label>Color</Label>
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
            Cancel
          </Button>
          <Button type="submit" disabled={createBoard.isPending}>
            {createBoard.isPending && <Spinner />}
            Create board
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
