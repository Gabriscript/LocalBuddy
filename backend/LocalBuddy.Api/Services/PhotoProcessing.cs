using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace LocalBuddy.Api.Services;

/// What every stored photo goes through, whether a member uploads it (PhotosController) or the
/// demo seed brings it (DemoSeeder): decoded, shrunk, turned upright, stripped of its metadata
/// and written again as a JPEG.
public static class PhotoProcessing
{
    /// A compressed file says nothing about its decoded size: a 200 KB PNG can decode to 183 MB.
    /// The header is read first and anything past this is refused before a pixel is allocated.
    const long MaxPixels = 50_000_000;

    /// Longest side of what is stored. Plenty for a phone screen, a fraction of the disk and data.
    const int MaxSide = 2048;

    /// Only what a phone or a browser hands over. Every other decoder ImageSharp ships is attack
    /// surface we have no use for, and the TIFF one has a known denial of service.
    public static readonly Configuration Formats =
        new(new JpegConfigurationModule(), new PngConfigurationModule(), new WebpConfigurationModule());

    /// The JPEG to store, or null and the problem code that refused it: `not_an_image` or
    /// `image_too_large`. `open` is called twice: once for the header, once to decode.
    public static async Task<(MemoryStream? Jpeg, string? Refusal)> NormaliseAsync(Func<Stream> open)
    {
        Image image;
        try
        {
            IImageInfo? info;
            await using (var header = open())
                info = await Image.IdentifyAsync(Formats, header);
            if (info is null) return (null, "not_an_image");
            if ((long)info.Width * info.Height > MaxPixels) return (null, "image_too_large");

            // Decoding is the real validation — a renamed .exe never gets this far.
            await using var incoming = open();
            image = await Image.LoadAsync(Formats, incoming);
        }
        catch (ImageFormatException) // unknown formats and corrupt data of a known format alike
        {
            return (null, "not_an_image");
        }

        using (image)
        {
            var oversized = Math.Max(image.Width, image.Height) > MaxSide;
            image.Mutate(x =>
            {
                // Shrink before turning: a rotation copies every pixel, and at full size that copy
                // doubled the memory of an upload. The box is square, so the result is the same.
                if (oversized) x.Resize(new ResizeOptions { Size = new Size(MaxSide, MaxSide), Mode = ResizeMode.Max });

                // Phones store portrait shots sideways plus an EXIF rotation flag. The flag is
                // about to be stripped, so the rotation has to reach the pixels before that.
                x.AutoOrient();
            });

            // GUIDELINES §9: strip EXIF before publishing — it carries the GPS coordinates
            // of where the shot was taken, i.e. the home address of the host.
            image.Metadata.ExifProfile = null;
            image.Metadata.XmpProfile = null;
            image.Metadata.IptcProfile = null;

            var jpeg = new MemoryStream();
            await image.SaveAsync(jpeg, new JpegEncoder());
            jpeg.Position = 0;
            return (jpeg, null);
        }
    }
}
