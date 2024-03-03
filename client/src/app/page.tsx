import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex h-screen w-full pt-16 pb-4 px-4 md:px-6 lg:px-8 gap-8">
      <section className="relative mx-auto w-2/5 h-full flex flex-col items-center justify-center only-tablet:w-full only-tablet:mx-auto">
        <article className="flex flex-col gap-4">
          <h1 className="text-pure-yellow text-2xl text-center">
            ¿Buscando la ferretería con los mejores productos?
          </h1>
          <h2 className="text-white text-lg text-center">
            ¡Somos perfectos para ti!
          </h2>
        </article>
        <div className="flex gap-4 my-6">
          <Link
            href="/auth"
            className="text-sm rounded-lg bg-dark-2a px-6 py-2"
          >
            Registrarse
          </Link>
          <Link
            href="/auth"
            className="text-sm rounded-lg bg-dark-2a px-6 py-2"
          >
            Iniciar sesión
          </Link>
        </div>
      </section>
      <section className="w-3/5 h-full only-tablet:hidden">
        <Image
          src="/instruments-of-carpenter-on-wooden-desk-landing.jpg"
          alt="Landing Hardware reference image"
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </section>
    </main>
  );
}
