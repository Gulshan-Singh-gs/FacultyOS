import { describe, it, expect, vi } from "vitest";
import {
  createPolicyInternal,
  updatePolicyInternal,
  deletePolicyInternal,
  listPoliciesForCourse,
  seedCoursePoliciesInternal,
  createPolicySnapshot,
  getPolicyById,
  PolicyAccessError,
  PolicyLimitError,
} from "@/server/services/policies";
import {
  PolicyConditionSchema,
  PolicySchema,
  PolicySnapshotSchema,
} from "@/lib/validations/policy";
import type { Db } from "@/server/db";
import { SEED_POLICY_TEMPLATES } from "@/server/services/policy-templates";

function createMockPolicyDb(initialData: {
  courses?: any[];
  profiles?: any[];
  policies?: any[];
} = {}) {
  const coursesStore = [...(initialData.courses || [])];
  const profilesStore = [...(initialData.profiles || [
    { id: "prof_owner", plan: "free" },
  ])];
  const policiesStore = [...(initialData.policies || [])];

  const mockDb = {
    select: vi.fn().mockImplementation((selection?: any) => ({
      from: vi.fn().mockImplementation((table: any) => ({
        where: vi.fn().mockImplementation((clause: any) => {
          if (selection && selection.total) {
            return Promise.resolve([{ total: policiesStore.length }]);
          }
          if (selection && selection.plan) {
            return {
              limit: () => Promise.resolve([profilesStore[0]]),
            };
          }
          return {
            limit: (lim: number) => Promise.resolve(coursesStore.slice(0, lim)),
            orderBy: () => Promise.resolve(policiesStore),
          };
        }),
        innerJoin: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: () => {
              const pol = policiesStore[0];
              if (!pol) return Promise.resolve([]);
              const crs = coursesStore.find((c) => c.id === pol.courseId);
              return Promise.resolve([
                { policy: pol, courseProfileId: crs?.profileId },
              ]);
            },
          })),
        })),
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((vals: any) => {
        policiesStore.push(vals);
        return {
          returning: () => Promise.resolve([vals]),
        };
      }),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((setVals: any) => ({
        where: vi.fn().mockImplementation(() => {
          if (policiesStore[0]) {
            Object.assign(policiesStore[0], setVals);
          }
          return {
            returning: () => Promise.resolve([policiesStore[0]]),
          };
        }),
      })),
    })),
    delete: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => {
        policiesStore.pop();
        return Promise.resolve([{ deleted: true }]);
      }),
    })),
    _store: { coursesStore, profilesStore, policiesStore },
  } as unknown as Db;

  return mockDb;
}

describe("Policy Schemas & Validation", () => {
  it("rejects invalid condition JSON", () => {
    // Missing required field
    expect(() =>
      PolicyConditionSchema.parse({
        field: "",
        operator: "equals",
      }),
    ).toThrow();

    // Invalid operator
    expect(() =>
      PolicyConditionSchema.parse({
        field: "hours_notice",
        operator: "invalid_operator",
        value: 48,
      }),
    ).toThrow();
  });

  it("validates a full policy input schema correctly", () => {
    const valid = {
      policyType: "extension",
      name: "48-Hour Notice Policy",
      priority: 10,
      conditions: [{ field: "hours_notice", operator: "gte", value: 48 }],
      actions: [{ type: "auto_approve", note: "Approved" }],
    };

    expect(() => PolicySchema.parse(valid)).not.toThrow();
  });

  it("rejects empty conditions or empty actions", () => {
    expect(() =>
      PolicySchema.parse({
        policyType: "extension",
        name: "Invalid Policy",
        priority: 10,
        conditions: [],
        actions: [{ type: "auto_approve" }],
      }),
    ).toThrow();
  });
});

describe("Policy CRUD Operations & Tenant Isolation", () => {
  it("blocks non-owner from creating a policy on someone else's course (Hard Rule 5)", async () => {
    const mockDb = createMockPolicyDb({
      courses: [{ id: "crs_1", profileId: "prof_legit_owner" }],
    });

    await expect(
      createPolicyInternal(
        mockDb,
        "prof_attacker",
        "crs_1",
        SEED_POLICY_TEMPLATES["extension-48h"].policy,
      ),
    ).rejects.toThrow(PolicyAccessError);
  });

  it("creates a policy with version 1 and serialized JSON", async () => {
    const mockDb = createMockPolicyDb({
      courses: [{ id: "crs_1", profileId: "prof_owner" }],
    });

    const created = await createPolicyInternal(
      mockDb,
      "prof_owner",
      "crs_1",
      SEED_POLICY_TEMPLATES["extension-48h"].policy,
    );

    expect(created.version).toBe(1);
    expect(created.policyType).toBe("extension");
    expect(JSON.parse(created.conditionsJson)).toEqual([
      { field: "hours_notice", operator: "gte", value: 48 },
    ]);
  });

  it("bumps version on edit (version 1 -> 2)", async () => {
    const initialPolicy = {
      id: "pol_1",
      courseId: "crs_1",
      version: 1,
      policyType: "extension",
      name: "Old Name",
      priority: 10,
      conditionsJson: JSON.stringify([{ field: "hours_notice", operator: "gte", value: 48 }]),
      actionsJson: JSON.stringify([{ type: "auto_approve" }]),
    };

    const mockDb = createMockPolicyDb({
      courses: [{ id: "crs_1", profileId: "prof_owner" }],
      policies: [initialPolicy],
    });

    const updated = await updatePolicyInternal(mockDb, "prof_owner", {
      policyId: "pol_1",
      name: "New Policy Name",
      priority: 5,
    });

    expect(updated.version).toBe(2);
    expect(updated.name).toBe("New Policy Name");
    expect(updated.priority).toBe(5);
  });

  it("blocks non-owner from updating or deleting a policy", async () => {
    const initialPolicy = {
      id: "pol_1",
      courseId: "crs_1",
      version: 1,
    };

    const mockDb = createMockPolicyDb({
      courses: [{ id: "crs_1", profileId: "prof_legit_owner" }],
      policies: [initialPolicy],
    });

    await expect(
      updatePolicyInternal(mockDb, "prof_attacker", {
        policyId: "pol_1",
        name: "Hacked Policy",
      }),
    ).rejects.toThrow(PolicyAccessError);

    await expect(
      deletePolicyInternal(mockDb, "prof_attacker", "pol_1"),
    ).rejects.toThrow(PolicyAccessError);
  });

  it("seeds course policies from templates", async () => {
    const mockDb = createMockPolicyDb({
      courses: [{ id: "crs_1", profileId: "prof_owner" }],
    });

    const seeded = await seedCoursePoliciesInternal(
      mockDb,
      "prof_owner",
      "crs_1",
      ["extension-48h", "late-penalty-10", "regrade-rubric"],
    );

    expect(seeded.length).toBe(3);
    expect(seeded[0].policyType).toBe("extension");
    expect(seeded[1].policyType).toBe("late_assignment");
    expect(seeded[2].policyType).toBe("regrade");
  });

  it("generates an immutable decision-time policy snapshot (Hard Rule 8)", () => {
    const policyRow = {
      id: "pol_1",
      courseId: "crs_1",
      policyType: "extension",
      name: "48-Hour Notice Policy",
      priority: 10,
      version: 3,
      conditionsJson: JSON.stringify([{ field: "hours_notice", operator: "gte", value: 48 }]),
      actionsJson: JSON.stringify([{ type: "auto_approve", note: "Approved" }]),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const snapshot = createPolicySnapshot(policyRow);

    expect(snapshot.policyId).toBe("pol_1");
    expect(snapshot.version).toBe(3);
    expect(snapshot.conditions[0].operator).toBe("gte");
    expect(snapshot.actions[0].type).toBe("auto_approve");
    expect(snapshot.capturedAt).toBeTypeOf("number");

    // Validates against PolicySnapshotSchema
    expect(() => PolicySnapshotSchema.parse(snapshot)).not.toThrow();
  });

  it("fetches policy by ID with ownership verification and blocks cross-owner access", async () => {
    const mockDb = createMockPolicyDb({
      courses: [
        { id: "crs_1", profileId: "prof_owner" },
        { id: "crs_other", profileId: "prof_other" },
      ],
      policies: [
        { id: "pol_1", courseId: "crs_1", name: "Owner Policy", version: 1 },
      ],
    }) as unknown as Db;

    // Authorized owner access
    const policy = await getPolicyById(mockDb, "prof_owner", "pol_1");
    expect(policy.id).toBe("pol_1");
    expect(policy.name).toBe("Owner Policy");

    // Block non-owner
    await expect(
      getPolicyById(mockDb, "prof_other", "pol_1"),
    ).rejects.toThrow(PolicyAccessError);
  });
});
