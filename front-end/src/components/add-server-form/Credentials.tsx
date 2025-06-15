import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import type { AddServerFormData } from "./types";

interface CredentialsProps {
  formData: AddServerFormData;
  errors: Partial<Record<keyof AddServerFormData, string>>;
  onInputChange: (
    field: keyof AddServerFormData,
    value: string | number
  ) => void;
}

export const Credentials = ({
  formData,
  errors,
  onInputChange,
}: CredentialsProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Authentication</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="guest"
            value={formData.username}
            onChange={(e) => onInputChange("username", e.target.value)}
            className={errors.username ? "border-red-500" : ""}
          />
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="guest"
              value={formData.password}
              onChange={(e) => onInputChange("password", e.target.value)}
              className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>
      </div>
    </div>
  );
};
