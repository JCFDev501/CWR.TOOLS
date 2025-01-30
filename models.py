from flask_login import UserMixin
from marshmallow_sqlalchemy.fields import Nested

from config import db, ma


# User
class User(db.Model, UserMixin):
    __tablename__ = 'user'  # The actual table name for the User class
    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(80), unique=True, nullable=False)
    user_password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)

    # Relationships to other tables
    sender_codes = db.relationship("SenderCode", back_populates="user")
    publishers = db.relationship("Publisher", back_populates="user")
    cwr_exports = db.relationship("CWRExport", back_populates="user")
    cwr_exported_works = db.relationship("CWRExportedWork", back_populates="user")
    societies = db.relationship("Society", back_populates="user")
    record_labels = db.relationship("RecordLabel", back_populates="user")
    musical_works = db.relationship("MusicalWork", back_populates="user")
    song_writers = db.relationship("SongWriter", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, name={self.user_name}, email={self.email})>"


# region classes
class SenderCode(db.Model):
    __tablename__ = 'sendercode'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(3))
    sender_ipi_s = db.relationship("Publisher")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="sender_codes")

    def __repr__(self):
        return f"<SenderCode(id={self.id}, code={self.code})>"


class Publisher(db.Model):
    __tablename__ = 'publisher'
    id = db.Column(db.Integer, primary_key=True)
    ipi = db.Column(db.BigInteger)
    company_name = db.Column(db.String(50))

    controlled = db.Column(db.Boolean)

    publisher_mechanical_soc = db.Column(db.Integer)

    publisher_sync_soc = db.Column(db.Integer)

    publisher_performance_soc = db.Column(db.Integer)

    sendercode_id = db.Column(db.Integer, db.ForeignKey('sendercode.id'), nullable=True)
    sendercode = db.relationship("SenderCode", back_populates="sender_ipi_s")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="publishers")

    def __repr__(self):
        return f"<Publisher(id={self.id}, ipi={self.ipi}, companyName={self.company_name})>"


class CWRExport(db.Model):
    __tablename__ = 'cwr_export'
    id = db.Column(db.Integer, primary_key=True)

    export_data = db.Column(db.String)

    file_name = db.Column(db.String(50))

    note = db.Column(db.String)

    exported_society_id = db.Column(db.Integer, db.ForeignKey('society.id'))
    exported_society = db.relationship("Society")

    exported_work_relations = db.relationship("CWRExportedWork")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="cwr_exports")

    def __repr__(self):
        return f"<CWRExport(id={self.id}, export_data={self.export_data})>"


class CWRExportedWork(db.Model):
    __tablename__ = 'cwr_exported_works'
    id = db.Column(db.Integer, primary_key=True)

    type = db.Column(db.String(50))

    musical_work_id = db.Column(db.Integer, db.ForeignKey('musical_work.id'))
    musical_work = db.relationship("MusicalWork", back_populates="exported_work_relations")

    cwr_export_id = db.Column(db.Integer, db.ForeignKey('cwr_export.id'))
    cwr_export = db.relationship("CWRExport", back_populates="exported_work_relations")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="cwr_exported_works")

    def __repr__(self):
        return f"<CWRExportedWork(id={self.id}, musical_work_id={self.musical_work_id}, cwr_export_id={self.cwr_export_id})>"


class SongRecording(db.Model):
    __tablename__ = 'song_recording'
    id = db.Column(db.Integer, primary_key=True)

    recording_id = db.Column(db.String(50))

    comp_work_id = db.Column(db.Integer, db.ForeignKey('musical_work.id'))
    comp_work = db.relationship("MusicalWork", back_populates="recordings")

    recording_title = db.Column(db.String(50))

    recording_version = db.Column(db.String(50))

    isrc = db.Column(db.String(12))

    ean = db.Column(db.String(11))

    record_label_id = db.Column(db.Integer, db.ForeignKey('recordlabel.id'))
    record_label = db.relationship("RecordLabel", back_populates="song_recordings")

    duration = db.Column(db.Integer)

    release_date = db.Column(db.Date)

    def __repr__(self):
        return f"<SongRecording(id={self.id}], recording_id={self.recording_id}, comp_work_id={self.comp_work_id}, " \
               f"recording_title={self.recording_title}, recording_version={self.recording_version}, isrc=" \
               f"{self.isrc}, record_labels={self.record_labels}, " \
               f"release_date={self.release_date}, duration={self.duration})> "


class ALTTitle(db.Model):
    __tablename__ = 'alt_title'
    id = db.Column(db.Integer, primary_key=True)

    locale = db.Column(db.String(3))

    type = db.Column(db.String(3))

    title = db.Column(db.String(50))

    comp_work_id = db.Column(db.Integer, db.ForeignKey('musical_work.id'))
    comp_work = db.relationship("MusicalWork", back_populates="alt_titles")

    def __repr__(self):
        return f"<ALTTitle(id={self.id}], locale={self.locale}, title={self.title}, comp_work_id={self.comp_work_id})>"


class RegistrationACK(db.Model):
    __tablename__ = 'registration_ack'
    id = db.Column(db.Integer, primary_key=True)

    society = db.Column(db.Integer, db.ForeignKey('society.id'))

    work_id = db.Column(db.String(50))

    ack_date = db.Column(db.Date)

    status = db.Column(db.Integer)

    comp_work_id = db.Column(db.Integer, db.ForeignKey('musical_work.id'))
    comp_work = db.relationship("MusicalWork", back_populates="acks")


    def __repr__(self):
        return f"<RegistrationACK(id={self.id}], society={self.society}, work_id={self.work_id}, ack_date={self.ack_date}, status={self.status}, comp_work_id={self.comp_work_id})>"


class Society(db.Model):
    __tablename__ = 'society'
    id = db.Column(db.Integer, primary_key=True)

    code = db.Column(db.String(3))

    name = db.Column(db.String(50))

    locale = db.Column(db.String(50))

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="societies")

    def __repr__(self):
        return f"<Society(id={self.id}], code={self.code}, name={self.name}, locale={self.locale})>"


class RecordLabel(db.Model):
    __tablename__ = 'recordlabel'
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(50))

    locale = db.Column(db.String(50))

    song_recordings = db.relationship("SongRecording")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="record_labels")

    def __repr__(self):
        return f"{self.name}{f' ({self.locale})' if self.locale else ''}"


class Performer(db.Model):
    __tablename__ = 'performer'
    id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(50))

    last_name = db.Column(db.String(50))

    isni = db.Column(db.String(50))

    musical_work_id = db.Column(db.Integer, db.ForeignKey('musical_work.id'))
    musical_work = db.relationship("MusicalWork", back_populates="performers")

    def __repr__(self):
        return f"<Performer(id={self.id}], name={self.name}, isni={self.isni}),  song_recording_id={self.musical_work_id}), >"


class MusicalWork(db.Model):
    __tablename__ = 'musical_work'
    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(50))

    iswc = db.Column(db.String(50))

    work_type = db.Column(db.Integer)

    is_library = db.Column(db.Boolean)

    writer_splits = db.relationship("WriterSplits", back_populates="musical_work")

    alt_titles = db.relationship("ALTTitle", back_populates="comp_work")

    recordings = db.relationship("SongRecording", back_populates="comp_work")

    acks = db.relationship("RegistrationACK", back_populates="comp_work")

    performers = db.relationship("Performer", back_populates="musical_work")

    exported_work_relations = db.relationship("CWRExportedWork")

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="musical_works")

    def __repr__(self):
        return f"<musical_work(title={self.title}], iswc={self.iswc}, work_type={self.work_type}, is_library={self.is_library}, alt_titles={self.alt_titles}, recordings={self.recordings}, performers={self.performers}, acks={self.acks})>"


class SongWriter(db.Model):
    __tablename__ = 'song_writer'
    id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))

    ipi = db.Column(db.BigInteger)

    pro_id = db.Column(db.Integer, db.ForeignKey('society.id'))
    pro = db.relationship("Society", foreign_keys=[pro_id])
    mro_id = db.Column(db.Integer, db.ForeignKey('society.id'))
    mro = db.relationship("Society", foreign_keys=[mro_id])
    sync_id = db.Column(db.Integer, db.ForeignKey('society.id'))
    sync = db.relationship("Society", foreign_keys=[sync_id])

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="song_writers")

    def __repr__(self):
        return f"<SongWriter(id={self.id}], first_name={self.first_name}, last_name={self.last_name}, ipi={self.ipi}, pro={self.pro})>"


class WriterTerritory(db.Model):
    __tablename__ = 'writer_territory'
    id = db.Column(db.Integer, primary_key=True)

    territory_name = db.Column(db.String(50))

    code = db.Column(db.Integer)

    writer_splits_id = db.Column(db.Integer, db.ForeignKey('writer_splits.id'))
    writer_splits = db.relationship("WriterSplits", back_populates="territories")

    def __repr__(self):
        return f"<WritersTerritory(id={self.id}], territory_name={self.territory_name}, code={self.code})>"


class PublishersTerritory(db.Model):
    __tablename__ = 'publishers_territory'
    id = db.Column(db.Integer, primary_key=True)

    territory_name = db.Column(db.String(50))

    code = db.Column(db.Integer)

    inclusion_ind = db.Column(db.String(1))

    publisher_mechanical_split = db.Column(db.Float)

    publisher_sync_split = db.Column(db.Float)

    publisher_proformance_split = db.Column(db.Float)

    publisher_splits_id = db.Column(db.Integer, db.ForeignKey('publisher_split.id'))
    publisher_splits = db.relationship("PublisherSplit", back_populates="territories")

    def __repr__(self):
        return f"<PublishersTerritory(id={self.id}], territory_name={self.territory_name}, inclusion_ind={self.inclusion_ind}, code={self.code})>"


class OPPublisher(db.Model):
    __tablename__ = "op_publisher"
    id = db.Column(db.Integer, primary_key=True)
    writer_splits_id = db.Column(db.Integer, db.ForeignKey('writer_splits.id'))
    writer_splits = db.relationship("WriterSplits", back_populates="op_publishers")

    publisher_mechanical_split = db.Column(db.Float)

    publisher_sync_split = db.Column(db.Float)

    publisher_proformance_split = db.Column(db.Float)

    op_publisher_splits_id = db.Column(db.Integer, db.ForeignKey('publisher_split.id'))
    op_publisher_splits = db.relationship("PublisherSplit")

    admin_publisher_splits = db.relationship("AdminPublisherRelationship", back_populates="op_publisher")

    sub_publisher_splits = db.relationship("SubPublisherRelationship", back_populates="op_publisher")

    def __repr__(self):
        return f"<OPPublisher(id={self.id}], admin_publisher_splits={self.admin_publisher_splits})>"


class AdminPublisherRelationship(db.Model):
    __tablename__ = 'publisher_admin'
    id = db.Column(db.Integer, primary_key=True)

    publisher_mechanical_split = db.Column(db.Integer)

    publisher_sync_split = db.Column(db.Integer)

    publisher_proformance_split = db.Column(db.Integer)

    op_publisher_id = db.Column(db.Integer, db.ForeignKey('op_publisher.id'))
    op_publisher = db.relationship("OPPublisher", back_populates="admin_publisher_splits")

    admin_publisher_id = db.Column(db.Integer, db.ForeignKey('publisher_split.id'))
    admin_publisher = db.relationship("PublisherSplit")


class SubPublisherRelationship(db.Model):
    __tablename__ = 'publisher_sub'
    id = db.Column(db.Integer, primary_key=True)

    publisher_mechanical_split = db.Column(db.Integer)

    publisher_sync_split = db.Column(db.Integer)

    publisher_proformance_split = db.Column(db.Integer)

    op_publisher_id = db.Column(db.Integer, db.ForeignKey('op_publisher.id'))
    op_publisher = db.relationship("OPPublisher", back_populates="sub_publisher_splits")

    sub_publisher_id = db.Column(db.Integer, db.ForeignKey('publisher_split.id'))
    sub_publisher = db.relationship("PublisherSplit")


class PublisherSplit(db.Model):
    __tablename__ = 'publisher_split'
    id = db.Column(db.Integer, primary_key=True)

    publisher_id = db.Column(db.Integer, db.ForeignKey('publisher.id'))
    publisher = db.relationship("Publisher")

    territories = db.relationship("PublishersTerritory", back_populates="publisher_splits")

    def __repr__(self):
        return f"<Publisher(id={self.id},)>"


class WriterSplits(db.Model):
    __tablename__ = 'writer_splits'
    id = db.Column(db.Integer, primary_key=True)

    musical_work_id = db.Column(db.Integer, db.ForeignKey('musical_work.id'))
    musical_work = db.relationship("MusicalWork", back_populates="writer_splits")

    controlled = db.Column(db.Boolean)

    territories = db.relationship("WriterTerritory", back_populates="writer_splits")

    writer_id = db.Column(db.Integer, db.ForeignKey('song_writer.id'))
    writer = db.relationship("SongWriter")

    writer_type = db.Column(db.String(2))

    percentage_of_song_owned = db.Column(db.Float)

    writer_mechanical_split = db.Column(db.Float)

    writer_sync_split = db.Column(db.Float)

    writer_proformance_split = db.Column(db.Float)

    op_publishers = db.relationship("OPPublisher", back_populates="writer_splits")

    def __repr__(self):
        return f"<WriterSplits(id={self.id}, musical_work_id={self.musical_work_id}, writer_id={self.writer_id}, writer={self.writer}, writer_type={self.writer_type}, writer_mechanical_split={self.writer_mechanical_split},writer_sync_split={self.writer_sync_split}, writer_proformance_split={self.writer_proformance_split}, percentage_of_song_owned={self.percentage_of_song_owned})>"


class SenderCodeSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SenderCode
        include_fk = True


class PublisherSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Publisher
        include_fk = True


class PerformerSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Performer
        include_fk = True


class SongRecordingSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SongRecording
        include_fk = True


class AdminPublisherRelationshipSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = AdminPublisherRelationship
        include_fk = True


class SubPublisherRelationshipSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SubPublisherRelationship
        include_fk = True


class OPPublisherSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = OPPublisher
        include_fk = True

    admin_publisher_splits = Nested(AdminPublisherRelationshipSchema, many=True)
    sub_publisher_splits = Nested(SubPublisherRelationshipSchema, many=True)


class WriterTerritorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = WriterTerritory
        include_fk = True


class WriterSplitsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = WriterSplits
        include_fk = True

    op_publishers = Nested(OPPublisherSchema, many=True)
    territories = Nested(WriterTerritorySchema, many=True)


class SocietySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Society
        include_fk = True


class RegistrationACKSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = RegistrationACK
        include_fk = True


class AltTitleSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ALTTitle
        include_fk = True


class MusicalWorkSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = MusicalWork
        include_fk = True

    performers = Nested(PerformerSchema, many=True)
    alt_titles = Nested(AltTitleSchema, many=True)
    recordings = Nested(SongRecordingSchema, many=True)
    writer_splits = Nested(WriterSplitsSchema, many=True)
    acks = Nested(RegistrationACKSchema, many=True)


class RecordLabelSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = RecordLabel
        include_fk = True


class SongWriterSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SongWriter
        include_fk = True


class PublishersTerritorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = PublishersTerritory
        include_fk = True


class PublisherSplitSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = PublisherSplit
        include_fk = True

    territories = Nested(PublishersTerritorySchema, many=True)


class CWRExportSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = CWRExport
        include_fk = True


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        include_fk = True


# endregion
if __name__ == "__main__":
    db.create_all()
