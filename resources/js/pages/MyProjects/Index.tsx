import React, { useState } from 'react'
import { Head } from '@inertiajs/react'

import AppLayout from '@/layouts/app-layout'
import HeadingSmall from '@/components/heading-small'

import { ProjectWithTasks, TaskWithComments } from '@/types/Extended'
import MyProjectsLayout from '@/layouts/project/myproject'
import KanbanBoard from './KanbanBoard'

type Props = {
    projects: ProjectWithTasks[]
    currentProjectId?: number
    tasks?: TaskWithComments[]
}

export default function MyProjects({ projects, currentProjectId, tasks = [] }: Props) {

    const [taskList, setTaskList] = useState<TaskWithComments[]>(tasks)

    const handleToggleDone = async (taskId: number) => {
        try {
            const response = await fetch(route('tasks.toggle-done', { task: taskId }), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement).content,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })

            const data = await response.json()

            setTaskList(prev =>
                prev.map(task =>
                    task.id === taskId ? { ...task, done: data.done } : task
                )
            )
        } catch (error) {
            console.error('Toggle failed:', error)
        }
    }

    return (
        <AppLayout>
            <MyProjectsLayout
                projects={projects}
                currentProjectId={currentProjectId?.toString() || ''}
            >
                <Head title="My Projects" />
                <div>
                    {currentProjectId == null ? (
                        <HeadingSmall
                            title="Select a Project"
                            description="Choose one from the sidebar to view your tasks."
                        />
                    ) : (
                        <>
                            <HeadingSmall
                                title="Your Tasks"
                                description="Tasks assigned to you in this project."
                            />

                            {taskList.length === 0 ? (
                                <div className="p-4 bg-yellow-50 text-yellow-700 rounded">
                                    You have no tasks in this project.
                                </div>
                            ) : (
                                <KanbanBoard initialTasks={taskList} onToggleDone={handleToggleDone} />
                            )}
                        </>
                    )}
                </div>
            </MyProjectsLayout>
        </AppLayout>
    )
}
