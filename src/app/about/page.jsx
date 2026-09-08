export const metadata = {
  title: 'About Us | Flowerista',
  description:
    'Flowerista is a Pakistani handmade-goods brand crafting crochet pieces and pipecleaner art — made with care, designed for the girly at heart.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <h1 className="text-4xl lg:text-5xl font-normal text-center text-text mb-16 pt-24">
        About Us
      </h1>
      <div className="max-w-[80%] mx-auto px-6 pb-24">

        <p className="text-sm lg:text-base text-muted-text leading-[1.9] mb-8">
          Flowerista started with a simple idea: handmade things should feel special — not mass-produced. Every piece we make is crafted by hand in Pakistan, from soft crochet baskets and bouquets to delicate pipecleaner name hangings and wall art. No two pieces are exactly alike, and that's exactly the point.
        </p>

        <p className="text-sm lg:text-base text-muted-text leading-[1.9] mb-8">
          We make for the people who love a little softness in their space — the ones who notice the details, who gift with intention, and who believe a handmade piece carries something a factory-made one never can. Whether it's a custom name hanging for a nursery or a flower bouquet that never wilts, everything we create is made to be kept.
        </p>

        <p className="text-sm lg:text-base text-muted-text leading-[1.9] mb-8">
          Because the best things are made slowly, with care — and they show it.
        </p>
      </div>
    </main>
  )
}
