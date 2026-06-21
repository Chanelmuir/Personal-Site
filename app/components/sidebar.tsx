import Image from "next/image";

export default function Sidebar() {
  return (
    <div>
      <div>
        <div className="relative size-12">
          <Image
              className="rounded-full"
              src="/the_sleeve_pfp.jpg"
              alt="Chanel Muir"
              priority
              fill
            />
        </div>
        <div>
          <h1 className="text-bold text-amber-950">Chanel Muir</h1>
        </div>
      </div>
    </div>
  );
}