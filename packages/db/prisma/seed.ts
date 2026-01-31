import {
  PrismaClient,
  Role,
  OpportunityStatus,
  ActivityType,
  MessageChannel
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // 1) Create workspace + owner user/member first
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
      }
    }
  });

  // 2) Create pipeline (explicitly attach workspace)
  const pipeline = await prisma.pipeline.create({
    data: {
      workspaceId: workspace.id,
      name: "Sales Pipeline"
    }
  });

  // 3) Create stages (explicitly attach workspace + pipeline)
  const [newStage] = await Promise.all([
    prisma.stage.create({
      data: {
        workspaceId: workspace.id,
        pipelineId: pipeline.id,
        name: "New",
        order: 1
      }
    }),
    prisma.stage.create({
      data: {
        workspaceId: workspace.id,
        pipelineId: pipeline.id,
        name: "Qualified",
        order: 2
      }
    }),
    prisma.stage.create({
      data: {
        workspaceId: workspace.id,
        pipelineId: pipeline.id,
        name: "Won",
        order: 3
      }
    })
  ]);

  // 4) Contact
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

  // 5) Opportunity
  const opportunity = await prisma.opportunity.create({
    data: {
      workspaceId: workspace.id,
      contactId: contact.id,
      stageId: newStage.id,
      value: 2500,
      status: OpportunityStatus.OPEN
    }
  });

  // 6) Activities
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

  // 7) Template
  await prisma.template.create({
    data: {
      workspaceId: workspace.id,
      name: "Welcome SMS",
      channel: MessageChannel.SMS,
      body: "Hi {{firstName}}, thanks for reaching out!"
    }
  });

  // 8) Form
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
  console.log("Demo login: owner@demo.local / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
