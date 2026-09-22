using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/v1/photos")]
[Authorize]
[Produces("application/json")]
public class PhotosController(LocalBuddyDbContext db, IPhotoStorage storage) : ControllerBase
{
    const long MaxBytes = 10 * 1024 * 1024;
    const int MaxPhotosPerUser = 12;

    /// A compressed file says nothing about its decoded size: a 200 KB PNG can decode to 183 MB.
    /// The header is read first and anything past this is refused before a pixel is allocated.
    const long MaxPixels = 50_000_000;

    /// Longest side of what is stored. Plenty for a phone screen, a fraction of the disk and data.
    const int MaxSide = 2048;

    /// Photos are not static files: every read passes through here so the host choice about
    /// anonymous visitors is actually enforced, instead of being bypassed by a bare URL.
    [HttpGet("{id:guid}/content")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> Content(Guid id)
    {
        var photo = await db.Photos.FindAsync(id);
        if (photo is null) return NotFound();

        var owner = await db.Users.FindAsync(photo.UserId);
        // NotFound rather than Forbid: a refusal should not confirm that the photo exists.
        if (owner is null || owner.BannedAt is not null || !User.CanSeeProfileOf(owner)) return NotFound();

        var content = await storage.OpenReadAsync(photo.Url, HttpContext.RequestAborted);
        if (content is null) return NotFound();

        return File(content, "image/jpeg");
    }

    [HttpPost]
    [RequestSizeLimit(MaxBytes)]
    [ProducesResponseType<PhotoDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(IFormFile file, PhotoType type)
    {
        if (file.Length == 0) return this.Invalid("empty_file", "The uploaded file is empty.");
        if (file.Length > MaxBytes) return this.Invalid("file_too_large", "Photos must be 10MB or smaller.");

        var me = User.Id();

        // Without a cap one account can fill the disk at 10 MB a request.
        if (await db.Photos.CountAsync(p => p.UserId == me) >= MaxPhotosPerUser)
            return this.Invalid("too_many_photos", $"At most {MaxPhotosPerUser} photos per member.");

        if (type == PhotoType.Home)
        {
            var listing = await db.Listings.FirstOrDefaultAsync(l => l.UserId == me);
            if (listing?.OffersOvernight != true)
                return this.Invalid("home_photo_not_allowed",
                    "Home photos are only for hosts offering overnight stays.");
        }

        Image image;
        try
        {
            IImageInfo? info;
            await using (var header = file.OpenReadStream())
                info = await Image.IdentifyAsync(header);
            if (info is null) return NotAnImage();
            if ((long)info.Width * info.Height > MaxPixels)
                return this.Invalid("image_too_large", "That image has too many pixels. Photos from a phone camera are fine.");

            // Decoding is the real validation — a renamed .exe never gets this far.
            await using var incoming = file.OpenReadStream();
            image = await Image.LoadAsync(incoming);
        }
        catch (ImageFormatException) // unknown formats and corrupt data of a known format alike
        {
            return NotAnImage();
        }

        using (image)
        {
            var oversized = Math.Max(image.Width, image.Height) > MaxSide;
            image.Mutate(x =>
            {
                // Phones store portrait shots sideways plus an EXIF rotation flag. The flag is
                // about to be stripped, so the rotation has to be applied to the pixels first.
                x.AutoOrient();
                if (oversized) x.Resize(new ResizeOptions { Size = new Size(MaxSide, MaxSide), Mode = ResizeMode.Max });
            });

            // GUIDELINES §9: strip EXIF before publishing — it carries the GPS coordinates
            // of where the shot was taken, i.e. the home address of the host.
            image.Metadata.ExifProfile = null;
            image.Metadata.XmpProfile = null;
            image.Metadata.IptcProfile = null;

            using var jpeg = new MemoryStream();
            await image.SaveAsync(jpeg, new JpegEncoder());
            jpeg.Position = 0;

            var photo = new Photo
            {
                Id = Guid.CreateVersion7(),
                UserId = me,
                Type = type,
                Url = await storage.SaveJpegAsync(jpeg)
            };
            db.Photos.Add(photo);
            await db.SaveChangesAsync();

            var dto = PhotoDto.From(photo);
            return Created(dto.Url, dto);
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var photo = await db.Photos.FirstOrDefaultAsync(p => p.Id == id && p.UserId == User.Id());
        if (photo is null) return NotFound();

        // Row first: a failed delete must not leave a profile pointing at a missing file.
        db.Photos.Remove(photo);
        await db.SaveChangesAsync();
        await storage.DeleteAsync(photo.Url);
        return NoContent();
    }

    ObjectResult NotAnImage() => this.Invalid("not_an_image", "That file is not a readable image.");
}
