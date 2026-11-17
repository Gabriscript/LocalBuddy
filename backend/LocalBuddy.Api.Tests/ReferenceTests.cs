using LocalBuddy.Api.Controllers;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Tests;

/// References (ADR-0017): a review with a thumb and how the two met, listed with its author and
/// counted on every card and on the profile.
public class ReferenceTests
{
    static async Task Chat(TestDb t, Guid a, Guid b)
    {
        var c = new Conversation { Id = Guid.CreateVersion7(), UserAId = a, UserBId = b };
        t.Db.Conversations.Add(c);
        t.Db.Messages.AddRange(
            new Message { Id = Guid.CreateVersion7(), ConversationId = c.Id, SenderId = a, Content = "ciao" },
            new Message { Id = Guid.CreateVersion7(), ConversationId = c.Id, SenderId = b, Content = "ciao!" });
        await t.Db.SaveChangesAsync();
    }

    static Task<IActionResult> Write(TestDb t, Guid author, NewReview review) =>
        new ReviewsController(t.Db).As(author).Create(review);

    static string? Code(IActionResult result) =>
        (Assert.IsType<ObjectResult>(result).Value as ProblemDetails)?.Extensions["code"]?.ToString();

    static void AddReference(TestDb t, Guid author, Guid subject, ReferenceContext? context) =>
        t.Db.Reviews.Add(new Review
        {
            Id = Guid.CreateVersion7(), AuthorId = author, SubjectId = subject, Rating = 5, Recommend = true,
            Context = context, Comment = "great"
        });

    /// Two people who have written to each other, ready for a reference from `author` about `subject`.
    static async Task<(TestDb T, Guid Author, Guid Subject)> InTouch()
    {
        var t = new TestDb();
        var (author, subject) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        await Chat(t, author, subject);
        return (t, author, subject);
    }

    [Theory]
    [InlineData(true, 5)]
    [InlineData(false, 1)]
    public async Task A_thumb_alone_stores_the_matching_rating(bool recommend, int rating)
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;

        var created = Assert.IsType<CreatedResult>(await Write(t, author, new NewReview(subject, "", Recommend: recommend)));

        var dto = Assert.IsType<ReviewDto>(created.Value);
        Assert.Equal((rating, recommend), (dto.Rating, dto.Recommend));
        var row = await t.Db.Reviews.SingleAsync();
        Assert.Equal((rating, (bool?)recommend), (row.Rating, row.Recommend));
    }

    /// An app that predates references sends only a rating: 4 and 5 count as a thumb up.
    [Theory]
    [InlineData(5, true)]
    [InlineData(4, true)]
    [InlineData(3, false)]
    [InlineData(1, false)]
    public async Task A_rating_alone_stores_the_matching_thumb(int rating, bool recommend)
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;

        Assert.IsType<CreatedResult>(await Write(t, author, new NewReview(subject, "ok", rating)));

        var row = await t.Db.Reviews.SingleAsync();
        Assert.Equal((rating, (bool?)recommend, (ReferenceContext?)null), (row.Rating, row.Recommend, row.Context));
    }

    [Fact]
    public async Task Both_are_stored_as_given()
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;

        Assert.IsType<CreatedResult>(await Write(t, author, new NewReview(subject, "", 2, Recommend: true)));

        var row = await t.Db.Reviews.SingleAsync();
        Assert.Equal((2, (bool?)true), (row.Rating, row.Recommend));
    }

    [Fact]
    public async Task Neither_a_rating_nor_a_thumb_is_refused()
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;

        var result = await Write(t, author, new NewReview(subject, "nothing to say", Context: ReferenceContext.MetUp));

        Assert.Equal(400, Assert.IsType<ObjectResult>(result).StatusCode);
        Assert.Equal("rating_or_recommend_required", Code(result));
        Assert.Equal(0, await t.Db.Reviews.CountAsync());
    }

    [Fact]
    public async Task An_unknown_context_is_refused()
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;

        var result = await Write(t, author, new NewReview(subject, "", Recommend: true, Context: (ReferenceContext)7));

        Assert.Equal("invalid_context", Code(result));
        Assert.Equal(0, await t.Db.Reviews.CountAsync());
    }

    [Fact]
    public async Task The_context_is_stored_and_listed_with_the_authors_name_and_photo()
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;
        var carla = t.AddVerifiedUser("carla");
        await Chat(t, carla, subject);
        var photo = new Photo { Id = Guid.CreateVersion7(), UserId = author, Type = PhotoType.Profile, Url = "/uploads/anna.jpg" };
        t.Db.Photos.Add(photo);
        await t.Db.SaveChangesAsync();

        var created = Assert.IsType<CreatedResult>(
            await Write(t, author, new NewReview(subject, "Bruno hosted me", Recommend: true, Context: ReferenceContext.WasHosted)));
        Assert.Equal((ReferenceContext?)ReferenceContext.WasHosted, Assert.IsType<ReviewDto>(created.Value).Context);
        Assert.Equal(PhotoDto.UrlFor(photo.Id), ((ReviewDto)created.Value!).AuthorPhotoUrl);
        Assert.IsType<CreatedResult>(await Write(t, carla, new NewReview(subject, "We met", Recommend: false, Context: ReferenceContext.MetUp)));

        var list = (await new ReviewsController(t.Db).As(carla).ForUser(subject)).Value!.Items;

        // Newest first, as before.
        Assert.Equal(["carla", "anna"], list.Select(r => r.AuthorName));
        Assert.Equal((false, ReferenceContext.MetUp, (string?)null), (list[0].Recommend!.Value, list[0].Context!.Value, list[0].AuthorPhotoUrl));
        Assert.Equal((true, ReferenceContext.WasHosted, PhotoDto.UrlFor(photo.Id)), (list[1].Recommend!.Value, list[1].Context!.Value, list[1].AuthorPhotoUrl));
    }

    /// A reference without a thumb or a context (written before ADR-0017) still lists, with neither.
    [Fact]
    public async Task An_old_review_lists_without_a_thumb_or_a_context()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));
        t.Db.Reviews.Add(new Review { Id = Guid.CreateVersion7(), AuthorId = anna, SubjectId = bruno, Rating = 4, Comment = "bene" });
        await t.Db.SaveChangesAsync();

        var item = Assert.Single((await new ReviewsController(t.Db).As(anna).ForUser(bruno)).Value!.Items);

        Assert.Equal((4, (bool?)null, (ReferenceContext?)null, "anna"), (item.Rating, item.Recommend, item.Context, item.AuthorName));
    }

    // ---- The rules a review already had --------------------------------------------------

    [Fact]
    public async Task A_thumb_still_needs_an_exchange()
    {
        using var t = new TestDb();
        var (anna, bruno) = (t.AddVerifiedUser("anna"), t.AddVerifiedUser("bruno"));

        Assert.Equal("no_exchange", Code(await Write(t, anna, new NewReview(bruno, "", Recommend: true, Context: ReferenceContext.MetUp))));
    }

    [Fact]
    public async Task A_thumb_is_still_ruled_out_by_a_block()
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;
        t.Db.Blocks.Add(new Block { Id = Guid.NewGuid(), BlockerId = subject, BlockedId = author });
        await t.Db.SaveChangesAsync();

        Assert.Equal("blocked", Code(await Write(t, author, new NewReview(subject, "", Recommend: false))));
    }

    [Fact]
    public async Task One_reference_per_pair_still_holds()
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;
        Assert.IsType<CreatedResult>(await Write(t, author, new NewReview(subject, "", Recommend: true)));

        var again = await Write(t, author, new NewReview(subject, "changed my mind", 1, false));

        Assert.Equal((409, "already_reviewed"), (Assert.IsType<ObjectResult>(again).StatusCode, Code(again)));
        Assert.Equal(1, await t.Db.Reviews.CountAsync());
    }

    [Fact]
    public async Task A_thumb_rewards_a_host_like_a_rating_did()
    {
        var (t, author, subject) = await InTouch();
        using var _ = t;
        t.Db.Listings.Add(new Listing { Id = Guid.NewGuid(), UserId = subject, OffersExperience = true });
        await t.Db.SaveChangesAsync();

        Assert.IsType<CreatedResult>(await Write(t, author, new NewReview(subject, "", Recommend: true, Context: ReferenceContext.WasHosted)));

        Assert.Equal(Pricing.HostReviewReward, await t.Db.Users.Where(u => u.Id == subject).Select(u => u.CreditsBalance).SingleAsync());
    }

    // ---- Counts --------------------------------------------------------------------------

    /// Bruno: one reference from a guest, one from a host, one from a meet-up and one old review.
    /// Only the first two have a side; all four count in the total.
    static async Task<(TestDb T, Guid Bruno, Guid Viewer)> Counted()
    {
        var t = new TestDb();
        var bruno = t.AddVerifiedUser("bruno");
        var viewer = t.AddVerifiedUser("viewer");
        var (guest, host, friend, old) = (t.AddVerifiedUser("guest"), t.AddVerifiedUser("host"), t.AddVerifiedUser("friend"), t.AddVerifiedUser("old"));
        AddReference(t, guest, bruno, ReferenceContext.WasHosted);
        AddReference(t, host, bruno, ReferenceContext.Hosted);
        AddReference(t, friend, bruno, ReferenceContext.MetUp);
        AddReference(t, old, bruno, null);
        // Someone else's reference does not count for bruno.
        AddReference(t, bruno, guest, ReferenceContext.Hosted);
        await t.Db.SaveChangesAsync();
        return (t, bruno, viewer);
    }

    static void AssertCounts(int total, int asHost, int asTraveller, ProfileCard card) =>
        Assert.Equal((total, asHost, asTraveller), (card.References, card.ReferencesAsHost, card.ReferencesAsTraveller));

    [Fact]
    public async Task Discovery_cards_carry_the_counts()
    {
        var (t, bruno, viewer) = await Counted();
        using var _ = t;

        var cards = (await new DiscoveryController(t.Db).As(viewer)
            .Search("Milano", null, null, null, null, null, null, pageSize: Page<ProfileCard>.MaxSize)).Value!.Items;

        AssertCounts(4, 1, 1, cards.Single(c => c.Id == bruno));
        AssertCounts(0, 0, 0, cards.Single(c => c.Name == "friend"));
        Assert.Equal(5.0, cards.Single(c => c.Id == bruno).Rating); // the average stays
    }

    [Fact]
    public async Task Request_cards_both_ways_carry_the_counts()
    {
        var (t, bruno, viewer) = await Counted();
        using var _ = t;
        var asker = t.AddVerifiedUser("asker");
        t.Db.Matches.AddRange(
            new Match { Id = Guid.CreateVersion7(), InitiatorId = bruno, TargetId = viewer, Status = MatchStatus.Pending },
            new Match { Id = Guid.CreateVersion7(), InitiatorId = asker, TargetId = bruno, Status = MatchStatus.Pending });
        await t.Db.SaveChangesAsync();
        MatchesController Matches(Guid caller) => new MatchesController(t.Db, new ConversationService(t.Db), TestPush.For(t.Db)).As(caller);

        AssertCounts(4, 1, 1, Assert.Single((await Matches(viewer).Requests()).Value!.Items));
        AssertCounts(4, 1, 1, Assert.Single((await Matches(asker).Sent()).Value!.Items));
    }

    [Fact]
    public async Task The_profile_carries_the_counts_and_zero_without_references()
    {
        var (t, bruno, viewer) = await Counted();
        using var _ = t;
        UsersController Users() => new UsersController(t.Db, null!, null!).As(viewer);

        var profile = (await Users().GetById(bruno)).Value!;
        Assert.Equal((4, 1, 1, 5.0), (profile.References, profile.ReferencesAsHost, profile.ReferencesAsTraveller, profile.Rating));

        var none = (await Users().GetById(viewer)).Value!;
        Assert.Equal((0, 0, 0, (double?)null), (none.References, none.ReferencesAsHost, none.ReferencesAsTraveller, none.Rating));
    }
}
