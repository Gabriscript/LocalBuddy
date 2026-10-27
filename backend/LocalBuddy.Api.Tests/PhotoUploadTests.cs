using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
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

    static IFormFile Jpeg(Image image)
    {
        var bytes = new MemoryStream();
        image.SaveAsJpeg(bytes);
        return File(bytes.ToArray());
    }

    static IFormFile File(byte[] bytes) => new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", "photo.png");

    static bool IsRed(Rgb24 pixel) => pixel is { R: > 200, G: < 60, B: < 60 };

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

    /// Phones store a portrait shot sideways, with an EXIF flag saying how to turn it. The flag
    /// leaves with the rest of the EXIF (GUIDELINES §9: it carries the GPS position), so the
    /// stored copy has to be upright on its own.
    [Fact]
    public async Task A_sideways_phone_photo_is_stored_upright_and_without_its_exif()
    {
        using var t = new TestDb();
        var storage = new KeepLast();
        using var sideways = new Image<Rgb24>(3000, 2000, new Rgb24(255, 255, 255));
        sideways.ProcessPixelRows(rows =>
        {
            for (var y = 0; y < 300; y++)
                rows.GetRowSpan(y)[..300].Fill(new Rgb24(255, 0, 0)); // red corner, top left as stored
        });
        sideways.Metadata.ExifProfile = new ExifProfile();
        sideways.Metadata.ExifProfile.SetValue(ExifTag.Orientation, (ushort)6); // view turned 90° clockwise

        Assert.IsType<CreatedResult>(
            await new PhotosController(t.Db, storage).As(t.AddUser("anna")).Upload(Jpeg(sideways), PhotoType.Profile));

        using var stored = Image.Load<Rgb24>(storage.Last!);
        Assert.Equal(2048, stored.Height);
        Assert.True(stored.Width < stored.Height);
        Assert.True(IsRed(stored[stored.Width - 10, 10])); // the corner turned to the top right
        Assert.False(IsRed(stored[10, 10]));
        Assert.Null(stored.Metadata.ExifProfile);
    }

    /// A feed card needs a phone's width and an avatar a fraction of it, not 2048 px of JPEG each.
    [Fact]
    public async Task A_smaller_copy_is_served_on_request_and_never_enlarged()
    {
        using var t = new TestDb();
        var storage = new KeepLast();
        var photos = new PhotosController(t.Db, storage).As(t.AddUser("anna"));
        using var big = new Image<Rgba32>(1600, 1000);
        var bigId = ((PhotoDto)Assert.IsType<CreatedResult>(await photos.Upload(Png(big), PhotoType.Profile)).Value!).Id;

        async Task<IImageInfo> Served(PhotoSize size) =>
            await Image.IdentifyAsync(Assert.IsType<FileStreamResult>(await photos.Content(bigId, size)).FileStream);

        Assert.Equal(1600, (await Served(PhotoSize.Full)).Width);
        Assert.Equal(1080, (await Served(PhotoSize.Medium)).Width);
        var thumb = await Served(PhotoSize.Thumb);
        Assert.Equal((256, 160), (thumb.Width, thumb.Height));

        using var tiny = new Image<Rgba32>(100, 80);
        var tinyId = ((PhotoDto)Assert.IsType<CreatedResult>(await photos.Upload(Png(tiny), PhotoType.Profile)).Value!).Id;
        var small = await Image.IdentifyAsync(Assert.IsType<FileStreamResult>(await photos.Content(tinyId, PhotoSize.Thumb)).FileStream);
        Assert.Equal(100, small.Width);
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

    /// ImageSharp 2.1.13 has a known TIFF denial of service, and no phone sends a TIFF: the format
    /// is refused at the header, before any decoder sees the file.
    [Fact]
    public async Task A_tiff_is_refused_before_it_reaches_a_decoder()
    {
        using var t = new TestDb();
        using var tiff = new Image<Rgba32>(10, 10);
        var bytes = new MemoryStream();
        tiff.SaveAsTiff(bytes);

        var result = await new PhotosController(t.Db, new KeepLast()).As(t.AddUser("anna")).Upload(File(bytes.ToArray()), PhotoType.Profile);

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

    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct = default) =>
        Task.FromResult<Stream?>(Last is null ? null : new MemoryStream(Last));
    public Task DeleteAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}
