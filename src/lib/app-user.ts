import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";

import { normalizeEmail } from "@/lib/password";

import { prisma } from "@/lib/prisma";



export type AppUser = { id: string; email: string | null };



/**

 * Clerk oturumunu Prisma User ile eşler (ilk girişte oluşturur veya e-posta ile mevcut satırı bağlar).

 */

export async function getAppUser(): Promise<AppUser | null> {

  const { userId } = await clerkAuth();

  if (!userId) return null;



  const existing = await prisma.user.findUnique({ where: { clerkUserId: userId } });

  if (existing) {

    return { id: existing.id, email: existing.email };

  }



  const cu = await currentUser();

  if (!cu) return null;



  const primaryRaw =

    cu.primaryEmailAddress?.emailAddress ??

    cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??

    cu.emailAddresses[0]?.emailAddress ??

    null;

  const email = primaryRaw ? normalizeEmail(primaryRaw) : null;

  const name = cu.fullName || [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() || null;



  if (email) {

    const byEmail = await prisma.user.findUnique({ where: { email } });

    if (byEmail) {

      if (!byEmail.clerkUserId) {

        const linked = await prisma.user.update({

          where: { id: byEmail.id },

          data: {

            clerkUserId: userId,

            name: name ?? byEmail.name,

            image: cu.imageUrl ?? byEmail.image,

            emailVerified: byEmail.emailVerified ?? new Date(),

          },

        });

        return { id: linked.id, email: linked.email };

      }

      if (byEmail.clerkUserId !== userId) {

        const row = await prisma.user.create({

          data: {

            clerkUserId: userId,

            email: null,

            name,

            image: cu.imageUrl ?? null,

          },

        });

        return { id: row.id, email: row.email };

      }

    }

  }



  const created = await prisma.user.create({

    data: {

      clerkUserId: userId,

      email,

      name,

      image: cu.imageUrl ?? null,

      emailVerified: email ? new Date() : null,

    },

  });



  return { id: created.id, email: created.email };

}


