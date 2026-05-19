import { deletePost } from '../_actions/delete-post';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PostsList({ posts }: { posts: Array<Record<string, string>> }) {
  if (!posts.length) return <p className="text-sm text-muted-foreground">No posts yet.</p>;

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{post.title}</p>
              <p className="text-xs text-muted-foreground">{post.body}</p>
            </div>
            <form action={deletePost}>
              <input type="hidden" name="id" value={post.id} />
              <Button type="submit" variant="outline">Delete</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
