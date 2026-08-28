namespace LocalBuddy.Api.Services;

/// Where user photos physically live. Behind an interface so moving to S3 / Azure Blob is a
/// registration change in Program.cs — see docs/adr/0003-local-disk-photo-storage.md.
public interface IPhotoStorage
{
    /// Stores an already decoded and EXIF-stripped JPEG. Returns its storage key.
    Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default);

    /// Opens a stored photo for reading, or null if the file is gone. Callers are responsible
    /// for deciding whether the requester is allowed to see it.
    Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default);

    /// Removes a stored photo. A missing file is not an error.
    Task DeleteAsync(string key, CancellationToken ct = default);
}

/// Single-node store under wwwroot/uploads. The directory is NOT served as static files:
/// every read goes through PhotosController so the per-host visibility rule can be applied.
public class LocalDiskPhotoStorage : IPhotoStorage
{
    readonly string root;

    public LocalDiskPhotoStorage(IWebHostEnvironment env)
        => root = Directory.CreateDirectory(Path.Combine(env.ContentRootPath, "wwwroot", "uploads")).FullName;

    public async Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default)
    {
        var fileName = $"{Guid.CreateVersion7():N}.jpg";
        await using var file = File.Create(Path.Combine(root, fileName));
        await jpeg.CopyToAsync(file, ct);
        return $"/uploads/{fileName}";
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default)
    {
        var path = Resolve(key);
        return Task.FromResult<Stream?>(File.Exists(path) ? File.OpenRead(path) : null);
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        var path = Resolve(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    // Leaf name only: a stored key must never be able to walk out of uploads/.
    string Resolve(string key) => Path.Combine(root, Path.GetFileName(key));
}
