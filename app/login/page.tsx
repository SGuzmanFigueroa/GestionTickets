import LoginBrand, { LoginBrandMobile } from "@/components/login/LoginBrand";
import AuthCard from "@/components/login/AuthCard";

// Supabase devuelve algunos errores de auth en inglés; los mostramos en
// español. Solo cambia el texto visible, no la lógica de app/login/actions.ts.
const AUTH_ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/email not confirmed/i, "Confirma tu correo desde el link que te enviamos antes de entrar."],
  [/user already registered/i, "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña."],
  [/password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/unable to validate email|invalid format/i, "Ese correo no es válido."],
  [/rate limit|too many requests/i, "Demasiados intentos. Espera unos minutos y vuelve a probar."],
];

function friendlyError(error?: string) {
  if (!error) return undefined;
  return AUTH_ERRORS.find(([pattern]) => pattern.test(error))?.[1] ?? error;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col bg-nexa-gray dark:bg-slate-900 md:flex-row">
      <LoginBrand />
      <LoginBrandMobile />

      <div className="flex flex-1 flex-col md:min-h-[100dvh]">
        <div className="flex flex-1 flex-col px-5 sm:px-8 md:justify-center md:px-10 md:py-12 lg:px-16">
          <div className="relative z-10 -mt-10 md:mt-0">
            <AuthCard error={friendlyError(error)} message={message} />
          </div>
        </div>
        <p className="px-5 py-6 text-center text-[11.5px] font-medium text-slate-400 dark:text-slate-500 lg:px-16">
          © {new Date().getFullYear()} NEXA CONSULTING TI S.A.C. · Uso interno
        </p>
      </div>
    </div>
  );
}
