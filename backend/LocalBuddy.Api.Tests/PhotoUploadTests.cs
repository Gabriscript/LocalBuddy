using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace LocalBuddy.Api.Tests;

public class PhotoUploadTests
{
    static IFormFile Png(Image image)
    {
        var bytes = new MemoryStream();
        image.SaveAsPng(bytes);
        return File(bytes.ToArray());
    }

    static IFormFile File(byte[] bytes) => new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", "photo.png");

    static string? Code(IActionResult result) =>
        (Assert.IsType<ObjectResult>(result).Value as ProblemDetails)?.Extensions["code"]?.ToString();

    [Fact]
    public async Task An_image_with_too_many_pixels_is_refused_before_it_is_decoded()
    {
        using var t = new TestDb();
        using var huge = new Image<L8>(7100, 7100); // 50.4 MP: tiny as a PNG, 50 MB once decoded

        var result = await new PhotosController(t.Db, new KeepLast()).As(t.AddUser("anna")).Upload(Png(huge), PhotoType.Profile);

        Assert.Equal("image_too_large", Code(result));
    }

    [Fact]
    public async Task A_large_photo_is_stored_at_2048_on_its_longest_side()
    {
        using var t = new TestDb();
        var storage = new KeepLast();
        using var wide = new Image<Rgba32>(3000, 100);

        Assert.IsType<CreatedResult>(
            await new PhotosController(t.Db, storage).As(t.AddUser("anna")).Upload(Png(wide), PhotoType.Profile));

        var stored = Image.Identify(storage.Last!);
        Assert.Equal(2048, stored.Width);
    }

    /// A known format with broken data used to escape the catch and come back as a 500.
    [Fact]
    public async Task A_corrupt_image_is_a_400_not_a_500()
    {
        using var t = new TestDb();
        using var noise = new Image<Rgba32>(64, 64);
        noise.ProcessPixelRows(rows =>
        {
            var random = new Random(1);
            for (var y = 0; y < rows.Height; y++)
                foreach (ref var pixel in rows.GetRowSpan(y))
                    pixel = new Rgba32((byte)random.Next(256), (byte)random.Next(256), (byte)random.Next(256));
        });
        var bytes = new MemoryStream();
        noise.SaveAsPng(bytes);
        var broken = bytes.ToArray();
        Array.Fill(broken, (byte)0xFF, broken.Length / 2, 64); // wreck the pixel data, keep the header

        var result = await new PhotosController(t.Db, new KeepLast()).As(t.AddUser("anna")).Upload(File(broken), PhotoType.Profile);

        Assert.Equal("not_an_image", Code(result));
    }

    [Fact]
    public async Task One_member_cannot_upload_without_limit()
    {
        using var t = new TestDb();
        var anna = t.AddUser("anna");
        for (var i = 0; i < 12; i++)
            t.Db.Photos.Add(new Photo { Id = Guid.NewGuid(), UserId = anna, Type = PhotoType.Profile, Url = $"/uploads/{i}.jpg" });
        await t.Db.SaveChangesAsync();
        using var small = new Image<Rgba32>(10, 10);

        var result = await new PhotosController(t.Db, new KeepLast()).As(anna).Upload(Png(small), PhotoType.Profile);

        Assert.Equal("too_many_photos", Code(result));
    }
}

file class KeepLast : IPhotoStorage
{
    public byte[]? Last;

    public async Task<string> SaveJpegAsync(Stream jpeg, CancellationToken ct = default)
    {
        var copy = new MemoryStream();
        await jpeg.CopyToAsync(copy, ct);
        Last = copy.ToArray();
        return $"/uploads/{Guid.NewGuid():N}.jpg";
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) => Task.FromResult<Stream?>(null);
    public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}
