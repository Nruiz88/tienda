"use client";

import { useState } from "react";
import {
  Check,
  CreditCard,
  Facebook,
  Instagram,
  Landmark,
  Mail,
  MessageCircle,
  Save,
} from "lucide-react";
import type { Configuracion, Marca } from "@/lib/shop/configuracion";
import { useAvisos } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubidorImagen } from "@/components/admin/subidor-imagen";
import { cn } from "@/lib/utils";
import { accionGuardarConfiguracion } from "@/app/(admin)/configuracion/actions";

const CAMPO =
  "w-full rounded-lg border border-borde bg-hundido px-3.5 py-2.5 text-sm text-texto placeholder:text-apagado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento";
const ETIQUETA = "mb-1.5 block text-[0.7rem] font-semibold tracking-[0.14em] text-apagado uppercase";

export function ConfiguracionForm({ inicial, marcaInicial }: { inicial: Configuracion; marcaInicial: Marca }) {
  const avisar = useAvisos();
  const [c, setC] = useState<Configuracion>(inicial);
  const [logo, setLogo] = useState(marcaInicial.logoUrl);
  const [banner, setBanner] = useState(marcaInicial.bannerUrl);
  /* El token NUEVO. Vacío = no se toca el que ya hay. */
  const [token, setToken] = useState("");
  const [guardando, setGuardando] = useState(false);

  function set<K extends keyof Configuracion>(clave: K, valor: Configuracion[K]) {
    setC((prev) => ({ ...prev, [clave]: valor }));
  }
  function setTransf(clave: keyof Configuracion["transferencia"], valor: string) {
    setC((prev) => ({ ...prev, transferencia: { ...prev.transferencia, [clave]: valor } }));
  }
  function setMP(clave: keyof Configuracion["mercadopago"], valor: string | boolean) {
    setC((prev) => ({ ...prev, mercadopago: { ...prev.mercadopago, [clave]: valor } }));
  }

  async function guardar() {
    setGuardando(true);
    try {
      const r = await accionGuardarConfiguracion({
        whatsapp: c.whatsapp,
        email: c.email,
        instagram: c.instagram,
        facebook: c.facebook,
        transferencia: c.transferencia,
        mercadopago: { publicKey: c.mercadopago.publicKey, accessToken: token || undefined },
        logoUrl: logo,
        bannerUrl: banner,
      });
      if (!r.ok) throw new Error();
      if (token) {
        setMP("accessTokenConfigurado", true);
        setToken("");
      }
      avisar("Configuración guardada");
    } catch {
      avisar("No se pudo guardar. Probá otra vez.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-texto">Configuración</h1>
          <p className="mt-1 text-sm text-apagado">Contacto, redes y formas de pago de tu tienda.</p>
        </div>
        <Button type="button" onClick={guardar} disabled={guardando}>
          <Save className="size-4" aria-hidden />
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Marca */}
        <section className="space-y-4 rounded-xl border border-borde bg-panel p-5 xl:col-span-2">
          <div>
            <h2 className="text-sm font-semibold text-texto">Marca</h2>
            <p className="mt-0.5 text-xs text-apagado">
              El logo se ve en la cabecera de la tienda; el banner, en la portada.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
            <SubidorImagen etiqueta="Logo" valor={logo} onChange={setLogo} carpeta="marca" />
            <SubidorImagen
              etiqueta="Banner de portada"
              valor={banner}
              onChange={setBanner}
              carpeta="marca"
              aspecto="ancho"
            />
          </div>
        </section>

        {/* Contacto */}
        <section className="space-y-4 rounded-xl border border-borde bg-panel p-5">
          <h2 className="text-sm font-semibold text-texto">Contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="whatsapp" className={ETIQUETA}>
                <MessageCircle className="mr-1.5 inline size-3.5 -translate-y-px text-ok" aria-hidden />
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={c.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+54 9 11 5555-0000"
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor="email" className={ETIQUETA}>
                <Mail className="mr-1.5 inline size-3.5 -translate-y-px text-acento" aria-hidden />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={c.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="hola@tutienda.com"
                className={CAMPO}
              />
            </div>
          </div>
        </section>

        {/* Redes */}
        <section className="space-y-4 rounded-xl border border-borde bg-panel p-5">
          <h2 className="text-sm font-semibold text-texto">Redes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="instagram" className={ETIQUETA}>
                <Instagram className="mr-1.5 inline size-3.5 -translate-y-px text-mal" aria-hidden />
                Instagram
              </label>
              <Input
                id="instagram"
                value={c.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="usuario"
                className="h-auto"
              />
            </div>
            <div>
              <label htmlFor="facebook" className={ETIQUETA}>
                <Facebook className="mr-1.5 inline size-3.5 -translate-y-px text-acento" aria-hidden />
                Facebook
              </label>
              <Input
                id="facebook"
                value={c.facebook}
                onChange={(e) => set("facebook", e.target.value)}
                placeholder="usuario"
                className="h-auto"
              />
            </div>
          </div>
        </section>

        {/* Transferencia */}
        <section className="space-y-4 rounded-xl border border-borde bg-panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-texto">
            <Landmark className="size-4 text-acento" aria-hidden />
            Transferencia
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="titular" className={ETIQUETA}>
                Titular
              </label>
              <input
                id="titular"
                value={c.transferencia.titular}
                onChange={(e) => setTransf("titular", e.target.value)}
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor="banco" className={ETIQUETA}>
                Banco
              </label>
              <input
                id="banco"
                value={c.transferencia.banco}
                onChange={(e) => setTransf("banco", e.target.value)}
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor="cbu" className={ETIQUETA}>
                CBU
              </label>
              <input
                id="cbu"
                inputMode="numeric"
                value={c.transferencia.cbu}
                onChange={(e) => setTransf("cbu", e.target.value)}
                placeholder="22 dígitos"
                className={cn(CAMPO, "cifra")}
              />
            </div>
            <div>
              <label htmlFor="alias" className={ETIQUETA}>
                Alias
              </label>
              <input
                id="alias"
                value={c.transferencia.alias}
                onChange={(e) => setTransf("alias", e.target.value)}
                placeholder="MI.ALIAS"
                className={cn(CAMPO, "uppercase")}
              />
            </div>
          </div>
        </section>

        {/* MercadoPago */}
        <section className="space-y-4 rounded-xl border border-borde bg-panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-texto">
            <CreditCard className="size-4 text-acento" aria-hidden />
            MercadoPago
          </h2>
          <div>
            <label htmlFor="publicKey" className={ETIQUETA}>
              Public Key
            </label>
            <input
              id="publicKey"
              value={c.mercadopago.publicKey}
              onChange={(e) => setMP("publicKey", e.target.value)}
              placeholder="APP_USR-…"
              className={CAMPO}
            />
          </div>
          <div>
            <label htmlFor="accessToken" className={ETIQUETA}>
              Access Token{" "}
              {c.mercadopago.accessTokenConfigurado && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-ok/10 px-2 py-0.5 text-[0.62rem] font-semibold text-ok normal-case">
                  <Check className="size-3" aria-hidden />
                  Configurado
                </span>
              )}
            </label>
            <input
              id="accessToken"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={c.mercadopago.accessTokenConfigurado ? "••••••••  (dejar vacío para no cambiarlo)" : "APP_USR-…"}
              className={CAMPO}
            />
            <p className="mt-2 text-xs text-apagado">
              Por seguridad, el token guardado no se muestra. Escribí uno nuevo solo si querés
              reemplazarlo.
            </p>
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={guardar} disabled={guardando}>
          <Save className="size-4" aria-hidden />
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
