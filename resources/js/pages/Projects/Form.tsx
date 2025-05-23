import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { FormEvent, useEffect, useRef } from 'react';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Project } from '@/types/Projects';
import { Textarea } from '@headlessui/react';
import Dropzoner from '@/components/dropzoner';
import ProjectsLayout from '@/layouts/project/layout';

interface FileData {
    file_name: string;
    size: number;
    original_url: string;
}

export default function ProjectForm({
    project,
    activities = [],
}: {
    project?: Project;
    activities?: {
        time: string;
        user: string;
        event: string;
        changes: Record<string, string | number | boolean>;
        old: Record<string, string | number | boolean>;
    }[];
}) {
    const isEdit = !!project;
    const { documents: initialDocs = [] } = usePage<{ documents: FileData[] }>().props;

    const { data, setData, post, put, processing, errors } = useForm({
        reference: project ? project.reference : '',
        name: project ? project.name : '',
        description: project ? project.description : '',
        metadata: project?.metadata ?? [] as string[],
        is_active: project ? project.is_active : true,
        documents: initialDocs.map(d => d.file_name),
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: isEdit ? 'Edit Project' : 'Create Project', href: '#' },
    ];

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) put(route('projects.update', project!.id));
        else post(route('projects.store'));
    };

    const dropzoneRef = useRef<HTMLDivElement>(null);
    const dzInstance = useRef<Dropzone | null>(null);
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const initialFiles: FileData[] = initialDocs;

    useEffect(() => {
        if (!dropzoneRef.current) return;
        if (dzInstance.current) dzInstance.current.destroy();

        dzInstance.current = Dropzoner(dropzoneRef.current, 'documents', {
            urlStore: route('storage.destroy'),
            urlDestroy: route('projects.deleteFile'),
            csrf: csrfToken,
            acceptedFiles: '.pdf',
            maxFiles: 1,
            files: initialFiles,
            kind: 'file',
            maxFilesize: 0.5,
            minFilesize: 100,
        });

        dzInstance.current.on('sending', (_, __, formData) => {
            if (project) formData.append('project_id', project.id.toString());
            formData.append('_token', csrfToken);
        });

        dzInstance.current.on('success', (_, response: { name: string; url?: string }) => {
            setData('documents', Array.from(new Set([...data.documents, response.name])));
        });

        dzInstance.current.on('removedfile', (file) => {
            if (!file.accepted) return;
            const fileName = file.name;
            console.log('File removed:', fileName);
            const updatedDocuments = data.documents.filter(f => f !== fileName);
            setData('documents', updatedDocuments);
        });
    }, [csrfToken, initialFiles, project, setData]);


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Project' : 'Create Project'} />
            <ProjectsLayout>
                <div className="px-4 py-6">
                    <h1 className="text-2xl font-semibold mb-4">Project Management</h1>
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                        <div className="w-full space-y-6">
                            <HeadingSmall
                                title={isEdit ? 'Edit Project' : 'Create Project'}
                                description="Fill in the details below"
                            />
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {isEdit && (
                                    <div>
                                        <Label htmlFor="reference">Reference</Label>
                                        <Input
                                            id="reference"
                                            type="text"
                                            value={data.reference}
                                            onChange={e => setData('reference', e.target.value)}
                                            required
                                            readOnly
                                        />
                                        <InputError message={errors.reference} />
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="name">Project Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description ?? ''}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                        rows={3}
                                        onInput={e => {
                                            const t = e.target as HTMLTextAreaElement;
                                            t.style.height = 'auto';
                                            t.style.height = `${t.scrollHeight}px`;
                                        }}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div>
                                    <Label htmlFor="metadata">Metadata (comma-separated)</Label>
                                    <Input
                                        id="metadata"
                                        type="text"
                                        value={Array.isArray(data.metadata) ? data.metadata.join(', ') : ''}
                                        onChange={e => setData('metadata', e.target.value.split(',').map(i => i.trim()))}
                                    />
                                    <InputError message={errors.metadata} />
                                </div>

                                <div>
                                    <Label htmlFor="documents">Documents</Label>
                                    <div ref={dropzoneRef} className="dropzone border-dashed border-2 rounded p-4" />
                                    <InputError message={errors.documents} />
                                </div>

                                <div>
                                    <Label htmlFor="is_active">Is Active</Label>
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', (e.target as HTMLInputElement).checked)}
                                    />
                                </div>

                                <div className="flex items-center space-x-4">
                                    <Button disabled={processing}>
                                        {isEdit ? 'Update Project' : 'Create Project'}
                                    </Button>
                                    <Link href={route('projects.index')} className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/70">
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                            {isEdit && activities.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="text-lg font-semibold mb-2">Audit Trail</h2>
                                    <table className="table-auto w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
                                                <th className="border border-gray-300 px-4 py-2 text-left">User</th>
                                                <th className="border border-gray-300 px-4 py-2 text-left">Event</th>
                                                <th className="border border-gray-300 px-4 py-2 text-left">Changes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.map((a, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 px-4 py-2">{a.time}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{a.user}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{a.event}</td>
                                                    <td className="border border-gray-300 px-4 py-2">
                                                        {Object.keys(a.changes).length > 0 ? (
                                                            <ul className="list-disc ml-4">
                                                                {Object.entries(a.changes).map(([key, value]) => (
                                                                    <li key={key}>
                                                                        <strong>{key}</strong>: "
                                                                        {typeof a.old?.[key] === 'object' ? JSON.stringify(a.old[key]) : a.old?.[key]}" → "
                                                                        {typeof value === 'object' ? JSON.stringify(value) : value}"
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            'No changes'
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </ProjectsLayout>
        </AppLayout>
    );
}
