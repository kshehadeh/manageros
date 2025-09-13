import { prisma } from "@/lib/db";
import Link from "next/link";
import { Rag } from "@/components/rag";
import { notFound } from "next/navigation";

interface PersonDetailPageProps {
    params: {
        id: string;
    };
}

export default async function PersonDetailPage({
    params,
}: PersonDetailPageProps) {
    const person = await prisma.person.findUnique({
        where: { id: params.id },
        include: {
            team: true,
            manager: true,
            reports: {
                include: {
                    team: true,
                },
                orderBy: { name: "asc" },
            },
            tasks: {
                include: {
                    initiative: true,
                    objective: true,
                },
                orderBy: { updatedAt: "desc" },
            },
            initiativeOwners: {
                include: {
                    initiative: {
                        include: {
                            team: true,
                        },
                    },
                },
                orderBy: { initiative: { updatedAt: "desc" } },
            },
            oneOnOnes: {
                include: {
                    manager: true,
                },
                orderBy: { scheduledAt: "desc" },
            },
            oneOnOnesAsManager: {
                include: {
                    report: true,
                },
                orderBy: { scheduledAt: "desc" },
            },
            checkIns: {
                include: {
                    initiative: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!person) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">{person.name}</h2>
                    <div className="text-sm text-neutral-400">
                        {person.role ?? ""}
                    </div>
                    <div className="text-xs text-neutral-500">
                        {person.email}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`badge ${
                            person.status === "active"
                                ? "rag-green"
                                : person.status === "inactive"
                                ? "rag-red"
                                : "rag-amber"
                        }`}
                    >
                        {person.status.replace("_", " ")}
                    </span>
                    <Link href={`/people/${person.id}/edit`} className="btn">
                        Edit Person
                    </Link>
                    <Link href="/people" className="btn">
                        Back to People
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <section className="card">
                    <h3 className="font-semibold mb-4">Basic Information</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium">Team:</span>
                            <div className="text-sm text-neutral-400">
                                {person.team ? (
                                    <Link
                                        href={`/teams/${person.team.id}`}
                                        className="hover:text-blue-400"
                                    >
                                        {person.team.name}
                                    </Link>
                                ) : (
                                    "No team assigned"
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Manager:
                            </span>
                            <div className="text-sm text-neutral-400">
                                {person.manager ? (
                                    <Link
                                        href={`/people/${person.manager.id}`}
                                        className="hover:text-blue-400"
                                    >
                                        {person.manager.name}
                                    </Link>
                                ) : (
                                    "No manager assigned"
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Start Date:
                            </span>
                            <div className="text-sm text-neutral-400">
                                {person.startedAt
                                    ? new Date(
                                          person.startedAt,
                                      ).toLocaleDateString()
                                    : "Not specified"}
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Reports:
                            </span>
                            <div className="text-sm text-neutral-400">
                                {person.reports.length} direct report
                                {person.reports.length !== 1 ? "s" : ""}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Direct Reports */}
                <section className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            Direct Reports ({person.reports.length})
                        </h3>
                        <Link href="/people/new" className="btn text-sm">
                            Add Report
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {person.reports.map((report) => (
                            <div
                                key={report.id}
                                className="border border-neutral-800 rounded-xl p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Link
                                            href={`/people/${report.id}`}
                                            className="font-medium hover:text-blue-400"
                                        >
                                            {report.name}
                                        </Link>
                                        <div className="text-sm text-neutral-400">
                                            {report.role ?? ""}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            {report.email}
                                        </div>
                                        {report.team && (
                                            <div className="text-xs text-neutral-500 mt-1">
                                                Team: {report.team.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`badge ${
                                                report.status === "active"
                                                    ? "rag-green"
                                                    : report.status ===
                                                      "inactive"
                                                    ? "rag-red"
                                                    : "rag-amber"
                                            }`}
                                        >
                                            {report.status.replace("_", " ")}
                                        </span>
                                        <Link
                                            href={`/people/${report.id}/edit`}
                                            className="btn text-sm"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {person.reports.length === 0 && (
                            <div className="text-neutral-400 text-sm text-center py-4">
                                No direct reports.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Owned Initiatives */}
                <section className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            Owned Initiatives ({person.initiativeOwners.length})
                        </h3>
                        <Link href="/initiatives/new" className="btn text-sm">
                            New Initiative
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {person.initiativeOwners.map((ownership) => (
                            <Link
                                key={ownership.initiative.id}
                                href={`/initiatives/${ownership.initiative.id}`}
                                className="block border border-neutral-800 rounded-xl p-3 hover:bg-neutral-800/60"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            {ownership.initiative.title}
                                        </div>
                                        <div className="text-sm text-neutral-400">
                                            {ownership.initiative.summary ?? ""}
                                        </div>
                                        <div className="text-xs text-neutral-500 mt-1">
                                            Role: {ownership.role} • Team:{" "}
                                            {ownership.initiative.team?.name ||
                                                "No team"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Rag rag={ownership.initiative.rag} />
                                        <span className="badge">
                                            {ownership.initiative.confidence}%
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {person.initiativeOwners.length === 0 && (
                            <div className="text-neutral-400 text-sm text-center py-4">
                                No owned initiatives.
                            </div>
                        )}
                    </div>
                </section>

                {/* Assigned Tasks */}
                <section className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            Assigned Tasks ({person.tasks.length})
                        </h3>
                        <Link href="/initiatives/new" className="btn text-sm">
                            New Task
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {person.tasks.slice(0, 5).map((task) => (
                            <div
                                key={task.id}
                                className="border border-neutral-800 rounded-xl p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            {task.title}
                                        </div>
                                        <div className="text-sm text-neutral-400">
                                            {task.description ?? ""}
                                        </div>
                                        <div className="text-xs text-neutral-500 mt-1">
                                            {task.initiative && (
                                                <span>
                                                    Initiative:{" "}
                                                    {task.initiative.title}
                                                </span>
                                            )}
                                            {task.objective && (
                                                <span>
                                                    {" "}
                                                    • Objective:{" "}
                                                    {task.objective.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`badge ${
                                                task.status === "done"
                                                    ? "rag-green"
                                                    : task.status === "doing"
                                                    ? "rag-amber"
                                                    : task.status === "blocked"
                                                    ? "rag-red"
                                                    : "badge"
                                            }`}
                                        >
                                            {task.status.replace("_", " ")}
                                        </span>
                                        {task.priority && (
                                            <span className="badge">
                                                P{task.priority}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {person.tasks.length === 0 && (
                            <div className="text-neutral-400 text-sm text-center py-4">
                                No assigned tasks.
                            </div>
                        )}
                        {person.tasks.length > 5 && (
                            <div className="text-center">
                                <Link
                                    href="/tasks"
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    View all {person.tasks.length} tasks
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Check-ins */}
                <section className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            Recent Check-ins ({person.checkIns.length})
                        </h3>
                        <Link href="/initiatives" className="btn text-sm">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {person.checkIns.slice(0, 3).map((checkIn) => (
                            <div
                                key={checkIn.id}
                                className="border border-neutral-800 rounded-xl p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Link
                                            href={`/initiatives/${checkIn.initiative.id}`}
                                            className="font-medium hover:text-blue-400"
                                        >
                                            {checkIn.initiative.title}
                                        </Link>
                                        <div className="text-sm text-neutral-400">
                                            {checkIn.summary}
                                        </div>
                                        <div className="text-xs text-neutral-500 mt-1">
                                            Week of{" "}
                                            {new Date(
                                                checkIn.weekOf,
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Rag rag={checkIn.rag} />
                                        <span className="badge">
                                            {checkIn.confidence}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {person.checkIns.length === 0 && (
                            <div className="text-neutral-400 text-sm text-center py-4">
                                No check-ins yet.
                            </div>
                        )}
                    </div>
                </section>

                {/* 1:1 Meetings */}
                <section className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">1:1 Meetings</h3>
                        <Link href="/oneonones" className="btn text-sm">
                            Manage 1:1s
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {/* As Manager */}
                        {person.oneOnOnesAsManager.length > 0 && (
                            <div>
                                <div className="text-sm font-medium mb-2">
                                    As Manager (
                                    {person.oneOnOnesAsManager.length})
                                </div>
                                {person.oneOnOnesAsManager
                                    .slice(0, 2)
                                    .map((oneOnOne) => (
                                        <div
                                            key={oneOnOne.id}
                                            className="border border-neutral-800 rounded-xl p-3 mb-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Link
                                                        href={`/people/${oneOnOne.report.id}`}
                                                        className="font-medium hover:text-blue-400"
                                                    >
                                                        {oneOnOne.report.name}
                                                    </Link>
                                                    <div className="text-sm text-neutral-400">
                                                        {oneOnOne.cadence ?? ""}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 mt-1">
                                                        {oneOnOne.scheduledAt
                                                            ? new Date(
                                                                  oneOnOne.scheduledAt,
                                                              ).toLocaleDateString()
                                                            : "TBD"}
                                                    </div>
                                                </div>
                                                <Link
                                                    href="/oneonones"
                                                    className="btn text-sm"
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* As Report */}
                        {person.oneOnOnes.length > 0 && (
                            <div>
                                <div className="text-sm font-medium mb-2">
                                    With Manager ({person.oneOnOnes.length})
                                </div>
                                {person.oneOnOnes
                                    .slice(0, 2)
                                    .map((oneOnOne) => (
                                        <div
                                            key={oneOnOne.id}
                                            className="border border-neutral-800 rounded-xl p-3 mb-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Link
                                                        href={`/people/${oneOnOne.manager.id}`}
                                                        className="font-medium hover:text-blue-400"
                                                    >
                                                        {oneOnOne.manager.name}
                                                    </Link>
                                                    <div className="text-sm text-neutral-400">
                                                        {oneOnOne.cadence ?? ""}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 mt-1">
                                                        {oneOnOne.scheduledAt
                                                            ? new Date(
                                                                  oneOnOne.scheduledAt,
                                                              ).toLocaleDateString()
                                                            : "TBD"}
                                                    </div>
                                                </div>
                                                <Link
                                                    href="/oneonones"
                                                    className="btn text-sm"
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {person.oneOnOnes.length === 0 &&
                            person.oneOnOnesAsManager.length === 0 && (
                                <div className="text-neutral-400 text-sm text-center py-4">
                                    No 1:1 meetings scheduled.
                                </div>
                            )}
                    </div>
                </section>
            </div>

            {/* Person Statistics */}
            <section className="card">
                <h3 className="font-semibold mb-4">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {person.reports.length}
                        </div>
                        <div className="text-sm text-neutral-400">
                            Direct Reports
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {person.initiativeOwners.length}
                        </div>
                        <div className="text-sm text-neutral-400">
                            Owned Initiatives
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {person.tasks.length}
                        </div>
                        <div className="text-sm text-neutral-400">
                            Assigned Tasks
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">
                            {person.checkIns.length}
                        </div>
                        <div className="text-sm text-neutral-400">
                            Check-ins
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
