import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const token = await getToken({ req: request });
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tags, paths } = body;

        // Revalidate specified tags
        if (tags && Array.isArray(tags)) {
            for (const tag of tags) {
                revalidateTag(tag);
                console.log(`Revalidated tag: ${tag}`);
            }
        }

        // Revalidate specified paths
        if (paths && Array.isArray(paths)) {
            for (const path of paths) {
                revalidatePath(path);
                console.log(`Revalidated path: ${path}`);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Cache revalidated successfully',
            revalidated: { tags, paths }
        });
    } catch (error) {
        console.error('Error revalidating cache:', error);
        return NextResponse.json(
            { error: 'Failed to revalidate cache' },
            { status: 500 }
        );
    }
} 