using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PhotosController(LocalBuddyDbContext db, IWebHostEnvironment env) : ControllerBase
{
    const long MaxBytes = 10 * 1024 * 1024;

    [HttpPost]
    [RequestSizeLimit(MaxBytes)]
    public async Task<IActionResult> Upload(IFormFile file, PhotoType type)
    {
        if (file.Length == 0) return BadRequest("Empty file");
        if (file.Length > MaxBytes) return BadRequest("File too large (max 10MB)");

        var me = User.Id();

        if (type == PhotoType.Home)
        {
            var listing = await db.Listings.FirstOrDefaultAsync(l => l.UserId == me);
            if (listing?.OffersOvernight != true)
                return BadRequest("Home photos are only for hosts offering overnight stays");
        }

        Image image;
        try
        {
            // Decoding is the real validation — a renamed .exe never gets this far.
            await using var incoming = file.OpenReadStream();
            image = await Image.LoadAsync(incoming);
        }
        catch (UnknownImageFormatException)
        {
            return BadRequest("Not a valid image");
        }

        using (image)
        {
            // GUIDELINES §9: strip EXIF before publishing — it carries the GPS coordinates
            // of where the shot was taken, i.e. the host's home address.
            image.Metadata.ExifProfile = null;
            image.Metadata.XmpProfile = null;
            image.Metadata.IptcProfile = null;

            var uploads = Path.Combine(env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploads);

            var fileName = $"{Guid.NewGuid():N}.jpg";
            await image.SaveAsync(Path.Combine(uploads, fileName), new JpegEncoder());

            var photo = new Photo { Id = Guid.NewGuid(), UserId = me, Type = type, Url = $"/uploads/{fileName}" };
            db.Photos.Add(photo);
            await db.SaveChangesAsync();

            return Ok(photo);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var photo = await db.Photos.FirstOrDefaultAsync(p => p.Id == id && p.UserId == User.Id());
        if (photo is null) return NotFound();

        var path = Path.Combine(env.WebRootPath, photo.Url.TrimStart('/'));
        if (System.IO.File.Exists(path)) System.IO.File.Delete(path);

        db.Photos.Remove(photo);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
