import { PrismaClient, Role, OpportunityStatus, ActivityType, MessageChannel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo", 10);
  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      members: {
        create: {
          role: Role.OWNER,
          user: {
            create: {
              email: "owner@demo.local",
              name: "Demo Owner",
              passwordHash
            }
          }
        }
      },
      pipelines: {
        create: {
          name: "Sales Pipeline",
          stages: {
            create: [
              { name: "New", order: 1 },
              { name: "Qualified", order: 2 },
              { name: "Won", order: 3 }
            ]
          }
        }
      }
    },
    include: {
      pipelines: { include: { stages: true } }
    }
  });

  const [newStage] = workspace.pipelines[0].stages;

  const contact = await prisma.contact.create({
    data: {
      workspaceId: workspace.id,
      firstName: "Avery",
      lastName: "Lee",
      email: "avery@example.com",
      phone: "+15555550100",
      tags: ["demo"],
      customFields: {}
    }
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      workspaceId: workspace.id,
      contactId: contact.id,
      stageId: newStage.id,
      value: 2500,
      status: OpportunityStatus.OPEN
    }
  });

  await prisma.activity.createMany({
    data: [
      {
        workspaceId: workspace.id,
        contactId: contact.id,
        opportunityId: opportunity.id,
        type: ActivityType.NOTE,
        body: "Demo lead created from seed script.",
        status: "open"
      },
      {
        workspaceId: workspace.id,
        contactId: contact.id,
        opportunityId: opportunity.id,
        type: ActivityType.CALL,
        body: "Called and left voicemail.",
        status: "done"
      }
    ]
  });

  await prisma.template.create({
    data: {
      workspaceId: workspace.id,
      name: "Welcome SMS",
      channel: MessageChannel.SMS,
      body: "Hi {{firstName}}, thanks for reaching out!"
    }
  });

  await prisma.form.create({
    data: {
      workspaceId: workspace.id,
      name: "Website Lead Form",
      fields: [
        { key: "firstName", label: "First name", type: "text" },
        { key: "lastName", label: "Last name", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone", type: "tel" },
        { key: "notes", label: "Notes", type: "textarea" }
      ]
    }
  });

  console.log("Seed complete. Demo workspace:", workspace.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
