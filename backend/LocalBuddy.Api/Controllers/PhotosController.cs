using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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

    /// Longest side of the copies Content can serve instead of the original.
    const int MediumSide = 1080;
    const int ThumbSide = 256;

    /// Photos are not static files: every read passes through here so the host choice about
    /// anonymous visitors is actually enforced, instead of being bypassed by a bare URL.
    [HttpGet("{id:guid}/content")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> Content(Guid id, PhotoSize size = PhotoSize.Full)
    {
        var photo = await db.Photos.FindAsync(id);
        if (photo is null) return NotFound();

        var owner = await db.Users.FindAsync(photo.UserId);
        // NotFound rather than Forbid: a refusal should not confirm that the photo exists.
        if (owner is null || owner.BannedAt is not null || !User.CanSeeProfileOf(owner)) return NotFound();

        if (User.TryGetId(out var me) && await db.IsBlockedBetweenAsync(me, photo.UserId)) return NotFound();

        // Home photos belong to an overnight listing: when the host stops offering it the profile
        // stops showing them (UsersController.GetById), and the bare URL has to stop serving them
        // too, or the inside of the house stays published to anyone who kept the link.
        if (photo.Type == PhotoType.Home &&
            !await db.Listings.AnyAsync(l => l.UserId == photo.UserId && l.OffersOvernight))
            return NotFound();

        var content = await storage.OpenReadAsync(photo.Url, HttpContext.RequestAborted);
        if (content is null) return NotFound();
        if (size == PhotoSize.Full) return File(content, "image/jpeg");

        // A feed of 2048 px originals is ~2.5 MB a card; a card needs a phone's width, an avatar a
        // fraction of it. shortcut: resized on every request, no cache; keep the result next to the
        // original when Discover gets real traffic.
        await using (content)
        {
            using var image = await Image.LoadAsync(PhotoProcessing.Formats, content, HttpContext.RequestAborted);
            var side = size == PhotoSize.Thumb ? ThumbSide : MediumSide;
            // Never enlarged: Max would stretch a small photo up to the box.
            if (Math.Max(image.Width, image.Height) > side)
                image.Mutate(x => x.Resize(new ResizeOptions { Size = new Size(side, side), Mode = ResizeMode.Max }));

            var jpeg = new MemoryStream();
            await image.SaveAsync(jpeg, new JpegEncoder(), HttpContext.RequestAborted);
            jpeg.Position = 0;
            return File(jpeg, "image/jpeg");
        }
    }

    [HttpPost]
    [RequestSizeLimit(MaxBytes)]
    [EnableRateLimiting("photo-upload")]
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

        var (normalised, refusal) = await PhotoProcessing.NormaliseAsync(file.OpenReadStream);
        if (refusal == "image_too_large")
            return this.Invalid("image_too_large", "That image has too many pixels. Photos from a phone camera are fine.");
        if (normalised is null) return NotAnImage();

        await using (var jpeg = normalised)
        {
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

/// Which copy of a photo `GET content` serves. Sent by name, like every enum on the wire.
public enum PhotoSize { Full, Medium, Thumb }
